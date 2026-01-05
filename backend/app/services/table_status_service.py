"""Helpers for deriving table status from reservations."""
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Iterable, List, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlmodel import Session, select

from app.models.reservation import TableReservation
from app.models.table import Table
from app.utils.enums import ReservationStatus, TableStatus


ACTIVE_RESERVATION_STATUSES = (
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.ACTIVE,
)

try:
    VIETNAM_TZ = ZoneInfo("Asia/Ho_Chi_Minh")
except ZoneInfoNotFoundError:
    VIETNAM_TZ = timezone(timedelta(hours=7))


def _ensure_vietnam_time(dt: Optional[datetime]) -> Optional[datetime]:
    """Attach Vietnam timezone if missing and convert aware datetimes."""
    if not dt:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=VIETNAM_TZ)
    return dt.astimezone(VIETNAM_TZ)


def _apply_status_for_window(
    tables: List[Table],
    reservations: List[TableReservation],
    target_start: datetime,
    target_end: datetime,
) -> List[Table]:
    reservations_by_table = defaultdict(list)
    for reservation in reservations:
        reservations_by_table[reservation.table_id].append(reservation)

    now_local = datetime.now(VIETNAM_TZ)
    local_start = _ensure_vietnam_time(target_start)
    local_end = _ensure_vietnam_time(target_end)

    is_current_window = (
        local_start is not None
        and local_end is not None
        and local_start <= now_local < local_end
    )

    for table in tables:
        if reservations_by_table.get(table.id):
            table.status = (
                TableStatus.OCCUPIED if is_current_window else TableStatus.RESERVED
            )
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
        target_start_naive = target_start
        target_end_naive = target_end
        reservations = db.exec(
            select(TableReservation).where(
                TableReservation.table_id.in_(table_ids),
                TableReservation.status.in_(ACTIVE_RESERVATION_STATUSES),
                TableReservation.start_time < target_end_naive,
                TableReservation.end_time > target_start_naive,
            )
        ).all()
        return _apply_status_for_window(
            tables,
            reservations,
            _ensure_vietnam_time(target_start),
            _ensure_vietnam_time(target_end),
        )

    now_utc = datetime.utcnow().replace(tzinfo=timezone.utc)
    now_local = now_utc.astimezone(VIETNAM_TZ)

    reservations = db.exec(
        select(TableReservation).where(
            TableReservation.table_id.in_(table_ids),
            TableReservation.status.in_(ACTIVE_RESERVATION_STATUSES),
            TableReservation.end_time >= now_utc.replace(tzinfo=None),
        )
    ).all()

    current_map = defaultdict(list)
    future_map = defaultdict(list)

    for reservation in reservations:
        start_local = _ensure_vietnam_time(reservation.start_time)
        end_local = _ensure_vietnam_time(reservation.end_time)
        if start_local and end_local and start_local <= now_local < end_local:
            current_map[reservation.table_id].append(reservation)
        elif start_local and start_local > now_local:
            future_map[reservation.table_id].append(reservation)

    for table in tables:
        if current_map.get(table.id):
            table.status = TableStatus.OCCUPIED
        elif future_map.get(table.id):
            table.status = TableStatus.RESERVED
        else:
            table.status = table.status or TableStatus.AVAILABLE

    return list(tables)
