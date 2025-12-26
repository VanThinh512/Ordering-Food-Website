"""Table model."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Unicode
from sqlmodel import SQLModel, Field, Relationship

from app.utils.enums import TableStatus

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.reservation import TableReservation


class Table(SQLModel, table=True):
    """Table model for dine-in orders (optional feature)."""
    __tablename__ = "tables"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    table_number: str = Field(
        sa_column=Column(
            "table_number",
            Unicode(20),
            unique=True,
            nullable=False,
            index=True
        ),
        max_length=20
    )
    capacity: int = Field(ge=1)  # Number of seats
    
    status: TableStatus = Field(default=TableStatus.AVAILABLE)
    location: Optional[str] = Field(
        default=None,
        sa_column=Column("location", Unicode(100), nullable=True),
        max_length=100
    )  # e.g., "Ground Floor", "2nd Floor"
    
    is_active: bool = Field(default=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    orders: List["Order"] = Relationship(back_populates="table")
    reservations: List["TableReservation"] = Relationship(
        back_populates="table",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
