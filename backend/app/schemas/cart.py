"""Cart schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Cart Item schemas
class CartItemBase(BaseModel):
    """Base cart item schema."""
    product_id: int
    quantity: int = Field(..., ge=1)


class CartItemCreate(CartItemBase):
    """Cart item creation schema."""
    pass


class CartItemUpdate(BaseModel):
    """Cart item update schema."""
    quantity: int = Field(..., ge=1)


class CartItemInDBBase(CartItemBase):
    """Cart item in database base schema."""
    id: int
    cart_id: int
    price_at_time: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CartItem(CartItemInDBBase):
    """Cart item response schema."""
    pass


# Cart schemas
class CartBase(BaseModel):
    """Base cart schema."""
    pass


class CartCreate(CartBase):
    """Cart creation schema."""
    pass


class CartInDBBase(CartBase):
    """Cart in database base schema."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Cart(CartInDBBase):
    """Cart response schema."""
    items: List[CartItem] = []
