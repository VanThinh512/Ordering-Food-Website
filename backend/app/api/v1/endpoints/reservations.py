"""Table reservation endpoints."""
from datetime import datetime, date, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.api.deps import get_current_active_user, get_db
from app.crud.reservation import reservation as reservation_crud
from app.crud.table import table as table_crud
from app.models.user import User
from app.schemas.reservation import (
    Reservation,
    ReservationCreate,
    ReservationSummary,
)
from app.utils.enums import ReservationStatus


router = APIRouter()


def _validate_time_window(start_time: datetime, end_time: datetime) -> None:
    if end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time",
        )
    duration = end_time - start_time
    if duration < timedelta(minutes=30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation must be at least 30 minutes",
        )
    if duration > timedelta(hours=4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation cannot exceed 4 hours",
        )


@router.get("/", response_model=List[Reservation])
def list_user_reservations(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Return reservations of current user."""
    statement = reservation_crud.model.__table__.select().where(
        reservation_crud.model.user_id == current_user.id
    )
    reservations = db.exec(statement).all()
    return reservations


@router.post("/", response_model=Reservation, status_code=status.HTTP_201_CREATED)
def create_reservation(
    *,
    db: Session = Depends(get_db),
    reservation_in: ReservationCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Create a reservation for a specific table and time window."""
    if reservation_in.table_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Table is required",
        )

    table = table_crud.get(db, id=reservation_in.table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found",
        )

    _validate_time_window(reservation_in.start_time, reservation_in.end_time)

    if reservation_crud.has_conflict(
        db,
        table_id=reservation_in.table_id,
        start=reservation_in.start_time,
        end=reservation_in.end_time,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot already reserved",
        )

    reservation = reservation_crud.create_for_user(
        db,
        obj_in=reservation_in,
        user_id=current_user.id,
        status=ReservationStatus.CONFIRMED,
    )
    return reservation


@router.get("/availability/{table_id}", response_model=List[ReservationSummary])
def get_table_availability(
    *,
    table_id: int,
    date_param: date = Query(default=date.today(), alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Return reservations for a table on a given day."""
    table = table_crud.get(db, id=table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found",
        )

    start = datetime.combine(date_param, datetime.min.time())
    end = datetime.combine(date_param, datetime.max.time())

    reservations = reservation_crud.get_for_table(db, table_id=table_id, start=start, end=end)
    summaries = [
        ReservationSummary(
            start_time=r.start_time,
            end_time=r.end_time,
            status=r.status,
            is_owned=r.user_id == current_user.id,
        )
        for r in reservations
    ]
    return summaries


@router.delete("/{reservation_id}", response_model=Reservation)
def cancel_reservation(
    *,
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Cancel a reservation owned by the user before it becomes active."""
    reservation = reservation_crud.get(db, id=reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    if reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    if reservation.status in (ReservationStatus.ACTIVE, ReservationStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel an active/completed reservation",
        )

    reservation = reservation_crud.update_status(
        db,
        reservation_id=reservation_id,
        status=ReservationStatus.CANCELLED,
        clear_order=True,
    )
    return reservation
