"""Helpers for deriving table status from reservations."""
from collections import defaultdict
from datetime import datetime
from typing import Iterable, List, Optional

from sqlmodel import Session, select

from app.models.reservation import TableReservation
from app.models.table import Table
from app.utils.enums import ReservationStatus, TableStatus


ACTIVE_RESERVATION_STATUSES = (
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.ACTIVE,
)


def _apply_status_for_window(
    tables: List[Table],
    reservations: List[TableReservation],
    target_start: datetime,
    target_end: datetime,
) -> List[Table]:
    reservations_by_table = defaultdict(list)
    for reservation in reservations:
        reservations_by_table[reservation.table_id].append(reservation)

    now = datetime.utcnow()
    is_current_window = target_start <= now < target_end

    for table in tables:
        if reservations_by_table.get(table.id):
            table.status = TableStatus.OCCUPIED if is_current_window else TableStatus.RESERVED
        else:
            table.status = TableStatus.AVAILABLE
    return tables


def annotate_tables_with_reservations(
    db: Session,
    tables: Iterable[Table],
    *,
    target_start: Optional[datetime] = None,
    target_end: Optional[datetime] = None,
) -> List[Table]:
    """Derive table status either for a concrete time window or for realtime view."""
    tables = list(tables)
    if not tables:
        return []

    table_ids = [table.id for table in tables if table.id]
    if not table_ids:
        return list(tables)

    target_window = target_start and target_end

    if target_window:
        reservations = db.exec(
            select(TableReservation).where(
                TableReservation.table_id.in_(table_ids),
                TableReservation.status.in_(ACTIVE_RESERVATION_STATUSES),
                TableReservation.start_time < target_end,
                TableReservation.end_time > target_start,
            )
        ).all()
        return _apply_status_for_window(tables, reservations, target_start, target_end)

    now = datetime.utcnow()

    reservations = db.exec(
        select(TableReservation).where(
            TableReservation.table_id.in_(table_ids),
            TableReservation.status.in_(ACTIVE_RESERVATION_STATUSES),
            TableReservation.end_time >= now,
        )
    ).all()

    current_map = defaultdict(list)
    future_map = defaultdict(list)

    for reservation in reservations:
        if reservation.start_time <= now < reservation.end_time:
            current_map[reservation.table_id].append(reservation)
        elif reservation.start_time > now:
            future_map[reservation.table_id].append(reservation)

    for table in tables:
        if current_map.get(table.id):
            table.status = TableStatus.OCCUPIED
        elif future_map.get(table.id):
            table.status = TableStatus.RESERVED
        else:
            table.status = table.status or TableStatus.AVAILABLE

    return list(tables)
