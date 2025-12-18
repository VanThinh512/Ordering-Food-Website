"""Auth service - Business logic for authentication."""
from datetime import timedelta
from typing import Optional
from sqlmodel import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.crud.user import user as user_crud
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.token import Token


class AuthService:
    """Service for authentication business logic."""

    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        """Register a new user with validation."""
        # Check if email already exists
        existing_user = user_crud.get_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Check if student_id already exists (if provided)
        if user_in.student_id:
            existing_student = user_crud.get_by_student_id(
                db, student_id=user_in.student_id
            )
            if existing_student:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student ID already registered",
                )
        
        # Create user
        user = user_crud.create(db, obj_in=user_in)
        return user

    @staticmethod
    def login_user(db: Session, email: str, password: str) -> Token:
        """Authenticate user and return access token."""
        # Authenticate user
        user = user_crud.authenticate(db, email=email, password=password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user_crud.is_active(user):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        
        # Create access token
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")

    @staticmethod
    def get_current_user(db: Session, user_id: int) -> User:
        """Get current user by ID."""
        user = user_crud.get(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        if not user_crud.is_active(user):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user",
            )
        
        return user

    @staticmethod
    def verify_user_permissions(user: User, required_role: str = None) -> bool:
        """Verify user has required permissions."""
        if required_role:
            if user.role != required_role and not user.is_superuser:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions",
                )
        return True


auth_service = AuthService()
