"""Order schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.utils.enums import OrderStatus, PaymentStatus


# Order Item schemas
class OrderItemBase(BaseModel):
    """Base order item schema."""
    product_id: int
    quantity: int = Field(..., ge=1)
    notes: Optional[str] = Field(None, max_length=500)


class OrderItemCreate(OrderItemBase):
    """Order item creation schema."""
    pass


class OrderItemInDBBase(OrderItemBase):
    """Order item in database base schema."""
    id: int
    order_id: int
    price_at_time: float
    subtotal: float
    created_at: datetime

    class Config:
        from_attributes = True


class OrderItem(OrderItemInDBBase):
    """Order item response schema."""
    pass


# Order schemas
class OrderBase(BaseModel):
    """Base order schema."""
    table_id: Optional[int] = None
    notes: Optional[str] = Field(None, max_length=1000)
    delivery_type: str = Field("pickup", max_length=50)


class OrderCreate(OrderBase):
    """Order creation schema."""
    reservation_id: Optional[int] = None


class OrderUpdate(BaseModel):
    """Order update schema."""
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = Field(None, max_length=1000)


class OrderInDBBase(OrderBase):
    """Order in database base schema."""
    id: int
    user_id: int
    total_amount: float
    status: OrderStatus
    payment_status: PaymentStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Order(OrderInDBBase):
    """Order response schema."""
    items: List[OrderItem] = []
