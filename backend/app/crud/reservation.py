"""CRUD helpers for table reservations."""
from datetime import datetime
from typing import List, Optional

from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models.reservation import TableReservation
from app.schemas.reservation import ReservationCreate, ReservationUpdate
from app.utils.enums import ReservationStatus


ACTIVE_STATUSES = (
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.ACTIVE,
)


class CRUDReservation(CRUDBase[TableReservation, ReservationCreate, ReservationUpdate]):
    """Reservation specific helpers."""

    def create_for_user(
        self,
        db: Session,
        *,
        obj_in: ReservationCreate,
        user_id: int,
        status: ReservationStatus = ReservationStatus.CONFIRMED,
    ) -> TableReservation:
        data = obj_in.model_dump()
        data["user_id"] = user_id
        data["status"] = status
        reservation = TableReservation(**data)
        db.add(reservation)
        db.commit()
        db.refresh(reservation)
        return reservation

    def get_for_table(
        self,
        db: Session,
        *,
        table_id: int,
        start: datetime,
        end: datetime,
    ) -> List[TableReservation]:
        statement = (
            select(TableReservation)
            .where(
                TableReservation.table_id == table_id,
                TableReservation.start_time < end,
                TableReservation.end_time > start,
            )
            .order_by(TableReservation.start_time)
        )
        return db.exec(statement).all()

    def has_conflict(
        self,
        db: Session,
        *,
        table_id: int,
        start: datetime,
        end: datetime,
    ) -> bool:
        statement = select(TableReservation).where(
            TableReservation.table_id == table_id,
            TableReservation.status.in_(ACTIVE_STATUSES),
            TableReservation.start_time < end,
            TableReservation.end_time > start,
        )
        return db.exec(statement).first() is not None

    def attach_order(
        self, db: Session, *, reservation_id: int, order_id: int
    ) -> TableReservation:
        reservation = db.get(TableReservation, reservation_id)
        if reservation:
            reservation.order_id = order_id
            reservation.status = ReservationStatus.ACTIVE
            reservation.updated_at = datetime.utcnow()
            db.add(reservation)
            db.commit()
            db.refresh(reservation)
        return reservation

    def update_status(
        self,
        db: Session,
        *,
        reservation_id: int,
        status: ReservationStatus,
        clear_order: bool = False,
    ) -> Optional[TableReservation]:
        reservation = db.get(TableReservation, reservation_id)
        if reservation:
            reservation.status = status
            reservation.updated_at = datetime.utcnow()
            if clear_order:
                reservation.order_id = None
            db.add(reservation)
            db.commit()
            db.refresh(reservation)
        return reservation


reservation = CRUDReservation(TableReservation)
