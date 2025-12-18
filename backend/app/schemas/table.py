"""Table schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.utils.enums import TableStatus


# Shared properties
class TableBase(BaseModel):
    """Base table schema."""
    table_number: str = Field(..., max_length=20)
    capacity: int = Field(..., ge=1)
    status: TableStatus = TableStatus.AVAILABLE
    location: Optional[str] = Field(None, max_length=100)
    is_active: bool = True


# Properties to receive via API on creation
class TableCreate(TableBase):
    """Table creation schema."""
    pass


# Properties to receive via API on update
class TableUpdate(BaseModel):
    """Table update schema."""
    table_number: Optional[str] = Field(None, max_length=20)
    capacity: Optional[int] = Field(None, ge=1)
    status: Optional[TableStatus] = None
    location: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


# Properties shared by models stored in DB
class TableInDBBase(TableBase):
    """Table in database base schema."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Properties to return to client
class Table(TableInDBBase):
    """Table response schema."""
    pass
