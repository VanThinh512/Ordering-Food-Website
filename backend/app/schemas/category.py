"""Category schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Shared properties
class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: bool = True
    sort_order: int = 0


# Properties to receive via API on creation
class CategoryCreate(CategoryBase):
    """Category creation schema."""
    pass


# Properties to receive via API on update
class CategoryUpdate(BaseModel):
    """Category update schema."""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


# Properties shared by models stored in DB
class CategoryInDBBase(CategoryBase):
    """Category in database base schema."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Properties to return to client
class Category(CategoryInDBBase):
    """Category response schema."""
    pass
