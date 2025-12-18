"""Product model."""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.cart import CartItem
    from app.models.order import OrderItem


class Product(SQLModel, table=True):
    """Product model (food items, beverages, etc.)."""
    __tablename__ = "products"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    price: float = Field(ge=0)  # Must be >= 0
    
    category_id: int = Field(foreign_key="categories.id", index=True)
    
    image_url: Optional[str] = Field(default=None, max_length=500)
    is_available: bool = Field(default=True)
    
    # Stock management (optional)
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    
    # Additional info
    preparation_time: Optional[int] = Field(default=None)  # in minutes
    calories: Optional[int] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    category: "Category" = Relationship(back_populates="products")
    cart_items: List["CartItem"] = Relationship(back_populates="product")
    order_items: List["OrderItem"] = Relationship(back_populates="product")
