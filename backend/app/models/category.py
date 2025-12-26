"""Category model."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Unicode
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.product import Product


class Category(SQLModel, table=True):
    """Product category model (e.g., Coffee, Tea, Food, Snacks)."""
    __tablename__ = "categories"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(
        sa_column=Column(
            "name",
            Unicode(100),
            unique=True,
            nullable=False,
            index=True
        ),
        max_length=100
    )
    description: Optional[str] = Field(
        default=None,
        sa_column=Column("description", Unicode(500), nullable=True),
        max_length=500
    )
    image_url: Optional[str] = Field(
        default=None,
        sa_column=Column("image_url", Unicode(500), nullable=True),
        max_length=500
    )
    
    is_active: bool = Field(default=True)
    sort_order: int = Field(default=0)  # For custom ordering
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    products: List["Product"] = Relationship(back_populates="category")
