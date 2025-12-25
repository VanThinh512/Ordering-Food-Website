"""Table reservation model."""
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Column, Unicode
from sqlmodel import SQLModel, Field, Relationship

from app.utils.enums import ReservationStatus

if TYPE_CHECKING:
    from app.models.table import Table
    from app.models.user import User
    from app.models.order import Order


class TableReservation(SQLModel, table=True):
    """Represents a booking for a dining table within a time range."""
    __tablename__ = "table_reservations"

    id: Optional[int] = Field(default=None, primary_key=True)
    table_id: int = Field(foreign_key="tables.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    order_id: Optional[int] = Field(default=None, foreign_key="orders.id", index=True)

    start_time: datetime = Field(index=True)
    end_time: datetime = Field(index=True)
    party_size: int = Field(default=1, ge=1)
    notes: Optional[str] = Field(
        default=None,
        sa_column=Column("notes", Unicode(500), nullable=True),
        max_length=500
    )
    status: ReservationStatus = Field(default=ReservationStatus.CONFIRMED, index=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Relationships
    table: "Table" = Relationship(back_populates="reservations")
    user: "User" = Relationship(back_populates="reservations")
    order: Optional["Order"] = Relationship(back_populates="reservation")
