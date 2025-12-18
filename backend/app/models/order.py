"""Order models."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from app.utils.enums import OrderStatus, PaymentStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.table import Table
    from app.models.product import Product


class Order(SQLModel, table=True):
    """Order model - completed orders from carts."""
    __tablename__ = "orders"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Optional table for dine-in orders
    table_id: Optional[int] = Field(default=None, foreign_key="tables.id", index=True)
    
    # Order info
    total_amount: float = Field(ge=0)
    status: OrderStatus = Field(default=OrderStatus.PENDING, index=True)
    payment_status: PaymentStatus = Field(default=PaymentStatus.UNPAID)
    
    # Additional info
    notes: Optional[str] = Field(default=None, max_length=1000)
    delivery_type: Optional[str] = Field(default="pickup", max_length=50)  # "pickup", "dine-in", "delivery"
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: "User" = Relationship(back_populates="orders")
    table: Optional["Table"] = Relationship(back_populates="orders")
    items: List["OrderItem"] = Relationship(
        back_populates="order",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class OrderItem(SQLModel, table=True):
    """Order item model - products in an order."""
    __tablename__ = "order_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="orders.id", index=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    
    quantity: int = Field(ge=1)  # Must be >= 1
    
    # Store price at time of order (price may change later)
    price_at_time: float = Field(ge=0)
    subtotal: float = Field(ge=0)  # quantity * price_at_time
    
    # Optional customization notes
    notes: Optional[str] = Field(default=None, max_length=500)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order: "Order" = Relationship(back_populates="items")
    product: "Product" = Relationship(back_populates="order_items")
