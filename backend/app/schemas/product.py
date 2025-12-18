"""Product schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Shared properties
class ProductBase(BaseModel):
    """Base product schema."""
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: float = Field(..., ge=0)
    category_id: int
    image_url: Optional[str] = Field(None, max_length=500)
    is_available: bool = True
    stock_quantity: Optional[int] = Field(None, ge=0)
    preparation_time: Optional[int] = None
    calories: Optional[int] = None


# Properties to receive via API on creation
class ProductCreate(ProductBase):
    """Product creation schema."""
    pass


# Properties to receive via API on update
class ProductUpdate(BaseModel):
    """Product update schema."""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, ge=0)
    category_id: Optional[int] = None
    image_url: Optional[str] = Field(None, max_length=500)
    is_available: Optional[bool] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    preparation_time: Optional[int] = None
    calories: Optional[int] = None


# Properties shared by models stored in DB
class ProductInDBBase(ProductBase):
    """Product in database base schema."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Properties to return to client
class Product(ProductInDBBase):
    """Product response schema."""
    pass
