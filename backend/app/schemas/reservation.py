"""Reservation schemas."""
from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, Field

from app.utils.enums import ReservationStatus


class ReservationBase(BaseModel):
    """Shared reservation properties."""
    start_time: datetime
    end_time: datetime
    party_size: int = Field(default=1, ge=1)
    notes: Optional[str] = Field(None, max_length=500)


class ReservationCreate(ReservationBase):
    """Schema for creating reservation."""
    table_id: Optional[int] = None


class ReservationUpdate(BaseModel):
    """Schema for updating reservation."""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    party_size: Optional[int] = Field(None, ge=1)
    notes: Optional[str] = Field(None, max_length=500)
    status: Optional[ReservationStatus] = None


class ReservationInDBBase(ReservationBase):
    """Base schema stored in DB."""
    id: int
    table_id: int
    user_id: int
    status: ReservationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Reservation(ReservationInDBBase):
    """Reservation response schema."""
    pass


class ReservationSummary(BaseModel):
    """Summary info for UI about availability."""
    start_time: datetime
    end_time: datetime
    status: ReservationStatus
    is_owned: bool = False
