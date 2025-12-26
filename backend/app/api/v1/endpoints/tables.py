"""Table endpoints."""
from datetime import datetime
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.api.deps import get_current_active_superuser
from app.crud.table import table as table_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.table import Table, TableCreate, TableUpdate
from app.utils.enums import TableStatus
from app.services.table_status_service import annotate_tables_with_reservations

router = APIRouter()


@router.get("/", response_model=List[Table])
def read_tables(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status_filter: TableStatus = Query(None, description="Filter by table status"),
    date: datetime = Query(None, description="Target date for availability check"),
    start_time: str = Query(None, description="Start time HH:MM"),
    end_time: str = Query(None, description="End time HH:MM"),
) -> Any:
    """Retrieve tables."""
    if status_filter:
        tables = table_crud.get_by_status(db, status=status_filter, skip=skip, limit=limit)
    else:
        tables = table_crud.get_multi(db, skip=skip, limit=limit)

    target_start = target_end = None
    if date and start_time and end_time:
        target_start = datetime.combine(date.date(), datetime.strptime(start_time, "%H:%M").time())
        target_end = datetime.combine(date.date(), datetime.strptime(end_time, "%H:%M").time())

    return annotate_tables_with_reservations(
        db,
        tables,
        target_start=target_start,
        target_end=target_end,
    )


@router.get("/available", response_model=List[Table])
def read_available_tables(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get available tables."""
    tables = table_crud.get_available(db, skip=skip, limit=limit)
    return annotate_tables_with_reservations(db, tables)


@router.post("/", response_model=Table, status_code=status.HTTP_201_CREATED)
def create_table(
    *,
    db: Session = Depends(get_db),
    table_in: TableCreate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Create new table (admin only)."""
    table = table_crud.get_by_number(db, table_number=table_in.table_number)
    if table:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Table with this number already exists",
        )
    table = table_crud.create(db, obj_in=table_in)
    return table


@router.get("/{table_id}", response_model=Table)
def read_table(
    table_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """Get table by ID."""
    table = table_crud.get(db, id=table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found",
        )
    return table


@router.put("/{table_id}", response_model=Table)
def update_table(
    *,
    db: Session = Depends(get_db),
    table_id: int,
    table_in: TableUpdate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Update a table (admin only)."""
    table = table_crud.get(db, id=table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found",
        )
    table = table_crud.update(db, db_obj=table, obj_in=table_in)
    return table


@router.delete("/{table_id}", response_model=Table)
def delete_table(
    *,
    db: Session = Depends(get_db),
    table_id: int,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Delete a table (admin only)."""
    table = table_crud.get(db, id=table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found",
        )
    table = table_crud.delete(db, id=table_id)
    return table
