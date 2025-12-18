"""Table model."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from app.utils.enums import TableStatus

if TYPE_CHECKING:
    from app.models.order import Order


class Table(SQLModel, table=True):
    """Table model for dine-in orders (optional feature)."""
    __tablename__ = "tables"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    table_number: str = Field(unique=True, max_length=20, index=True)
    capacity: int = Field(ge=1)  # Number of seats
    
    status: TableStatus = Field(default=TableStatus.AVAILABLE)
    location: Optional[str] = Field(default=None, max_length=100)  # e.g., "Ground Floor", "2nd Floor"
    
    is_active: bool = Field(default=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    orders: List["Order"] = Relationship(back_populates="table")
