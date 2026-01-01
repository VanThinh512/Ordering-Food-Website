"""User model."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Unicode
from sqlmodel import SQLModel, Field, Relationship

from app.utils.enums import UserRole

if TYPE_CHECKING:
    from app.models.cart import Cart
    from app.models.order import Order
    from app.models.reservation import TableReservation


class User(SQLModel, table=True):
    """User model - supports admin, staff, and student roles."""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(
        sa_column=Column("email", Unicode(255), unique=True, nullable=False, index=True),
        max_length=255
    )
    hashed_password: str = Field(
        sa_column=Column("hashed_password", Unicode(255), nullable=False),
        max_length=255
    )
    full_name: str = Field(
        sa_column=Column("full_name", Unicode(255), nullable=False),
        max_length=255
    )
    phone: Optional[str] = Field(
        default=None,
        sa_column=Column("phone", Unicode(20), nullable=True),
        max_length=20
    )
    
    # Google OAuth
    google_id: Optional[str] = Field(
        default=None,
        sa_column=Column("google_id", Unicode(255), nullable=True, unique=True, index=True),
        max_length=255
    )
    google_email: Optional[str] = Field(
        default=None,
        sa_column=Column("google_email", Unicode(255), nullable=True),
        max_length=255
    )
    google_picture: Optional[str] = Field(
        default=None,
        sa_column=Column("google_picture", Unicode(500), nullable=True),
        max_length=500
    )
    
    role: UserRole = Field(default=UserRole.STUDENT)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    
    # Student-specific fields (optional)
    student_id: Optional[str] = Field(
        default=None,
        sa_column=Column("student_id", Unicode(50), nullable=True, index=True),
        max_length=50
    )
    class_name: Optional[str] = Field(
        default=None,
        sa_column=Column("class_name", Unicode(100), nullable=True),
        max_length=100
    )
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    carts: List["Cart"] = Relationship(back_populates="user")
    orders: List["Order"] = Relationship(back_populates="user")
    reservations: List["TableReservation"] = Relationship(back_populates="user")
