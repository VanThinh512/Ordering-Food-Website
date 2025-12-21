"""CRUD operations for Table model."""
from typing import Optional, List
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models.table import Table
from app.schemas.table import TableCreate, TableUpdate
from app.utils.enums import TableStatus


class CRUDTable(CRUDBase[Table, TableCreate, TableUpdate]):
    """CRUD operations for Table model."""

    def get_by_number(self, db: Session, *, table_number: str) -> Optional[Table]:
        """Get table by number."""
        statement = select(Table).where(Table.table_number == table_number)
        return db.exec(statement).first()

    def get_by_status(
        self, db: Session, *, status: TableStatus, skip: int = 0, limit: int = 100
    ) -> List[Table]:
        """Get tables by status."""
        statement = (
            select(Table)
            .where(Table.status == status)
            .order_by(Table.id)
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_available(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Table]:
        """Get available tables."""
        return self.get_by_status(db, status=TableStatus.AVAILABLE, skip=skip, limit=limit)

    def update_status(
        self, db: Session, *, table_id: int, status: TableStatus
    ) -> Optional[Table]:
        """Update table status."""
        table = db.get(Table, table_id)
        if table:
            table.status = status
            db.add(table)
            db.commit()
            db.refresh(table)
        return table


table = CRUDTable(Table)
