"""Cart models."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Unicode
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class Cart(SQLModel, table=True):
    """Shopping cart model - one cart per user."""
    __tablename__ = "carts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, index=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: "User" = Relationship(back_populates="carts")
    items: List["CartItem"] = Relationship(
        back_populates="cart",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class CartItem(SQLModel, table=True):
    """Cart item model - products in a cart."""
    __tablename__ = "cart_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    cart_id: int = Field(foreign_key="carts.id", index=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    
    quantity: int = Field(ge=1)  # Must be >= 1
    
    # Store price at time of adding to cart
    price_at_time: float = Field(ge=0)
    # notes: Optional[str] = Field(
    #     default=None,
    #     sa_column=Column("notes", Unicode(500), nullable=True),
    #     max_length=500
    # )
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    cart: "Cart" = Relationship(back_populates="items")
    product: "Product" = Relationship(back_populates="cart_items")
