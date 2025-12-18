"""User schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.utils.enums import UserRole


# Shared properties
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.STUDENT
    is_active: bool = True
    student_id: Optional[str] = None
    class_name: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=6)


# Properties to receive via API on update
class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    student_id: Optional[str] = None
    class_name: Optional[str] = None


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    """User in database base schema."""
    id: int
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Properties to return to client
class User(UserInDBBase):
    """User response schema."""
    pass


# Properties stored in DB
class UserInDB(UserInDBBase):
    """User in database schema."""
    hashed_password: str
