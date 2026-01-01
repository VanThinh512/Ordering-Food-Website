"""Order schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.utils.enums import OrderStatus, PaymentStatus, PaymentMethod
from app.schemas.reservation import ReservationSummary


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


class OrderProductInfo(BaseModel):
    """Lightweight product info returned with order items."""
    id: Optional[int]
    name: Optional[str]
    description: Optional[str]
    price: Optional[float]

    class Config:
        from_attributes = True


class OrderItem(OrderItemInDBBase):
    """Order item response schema."""
    product: Optional[OrderProductInfo] = None


class OrderTableInfo(BaseModel):
    """Lightweight table info returned with orders."""
    id: Optional[int]
    table_number: Optional[str]
    location: Optional[str]

    class Config:
        from_attributes = True


class OrderUserInfo(BaseModel):
    """Lightweight user info returned with orders."""
    id: Optional[int]
    full_name: Optional[str]
    email: Optional[str]

    class Config:
        from_attributes = True


# Order schemas
class OrderBase(BaseModel):
    """Base order schema."""
    table_id: Optional[int] = None
    notes: Optional[str] = Field(None, max_length=1000)
    delivery_type: str = Field("pickup", max_length=50)


class OrderCreate(OrderBase):
    """Order creation schema."""
    reservation_id: Optional[int] = None
    payment_method: Optional[PaymentMethod] = Field(default=PaymentMethod.CASH)


class OrderUpdate(BaseModel):
    """Order update schema."""
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    bank_transfer_code: Optional[str] = None
    bank_transfer_verified: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=1000)


class OrderStatusUpdate(BaseModel):
    """Order status only update."""
    status: OrderStatus


class OrderInDBBase(OrderBase):
    """Order in database base schema."""
    id: int
    user_id: int
    payment_method: PaymentMethod
    bank_transfer_code: Optional[str] = None
    bank_transfer_verified: bool = False
    total_amount: float
    status: OrderStatus
    payment_status: PaymentStatus
    reservation_start_time: Optional[datetime] = None
    reservation_end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Order(OrderInDBBase):
    """Order response schema."""
    items: List[OrderItem] = []
    table: Optional[OrderTableInfo] = None
    user: Optional[OrderUserInfo] = None
    reservation: Optional[ReservationSummary] = None
