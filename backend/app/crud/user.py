"""CRUD operations for User model."""
from typing import Optional
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """CRUD operations for User model."""

    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Get user by email."""
        statement = select(User).where(User.email == email)
        return db.exec(statement).first()

    def get_by_student_id(self, db: Session, *, student_id: str) -> Optional[User]:
        """Get user by student ID."""
        statement = select(User).where(User.student_id == student_id)
        return db.exec(statement).first()
    
    def get_by_google_id(self, db: Session, *, google_id: str) -> Optional[User]:
        """Get user by Google ID."""
        statement = select(User).where(User.google_id == google_id)
        return db.exec(statement).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """Create new user with hashed password."""
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            phone=obj_in.phone,
            role=obj_in.role,
            is_active=obj_in.is_active,
            student_id=obj_in.student_id,
            class_name=obj_in.class_name,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: UserUpdate
    ) -> User:
        """Update user."""
        update_data = obj_in.model_dump(exclude_unset=True)
        
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(
        self, db: Session, *, email: str, password: str
    ) -> Optional[User]:
        """Authenticate user."""
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        """Check if user is active."""
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        """Check if user is superuser."""
        return user.is_superuser
    
    def get_or_create_by_google(
        self, 
        db: Session, 
        *, 
        google_id: str,
        email: str,
        full_name: str,
        picture: Optional[str] = None
    ) -> User:
        """Get or create user by Google ID."""
        # Try to find existing user by Google ID
        user = self.get_by_google_id(db, google_id=google_id)
        if user:
            # Update picture if changed
            if picture and user.google_picture != picture:
                user.google_picture = picture
                db.add(user)
                db.commit()
                db.refresh(user)
            return user
        
        # Try to find by email (link existing account)
        user = self.get_by_email(db, email=email)
        if user:
            # Link Google account to existing user
            user.google_id = google_id
            user.google_email = email
            user.google_picture = picture
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        
        # Create new user with Google info
        # Generate a random password since they'll login with Google
        import secrets
        random_password = secrets.token_urlsafe(32)
        
        user = User(
            email=email,
            hashed_password=get_password_hash(random_password),
            full_name=full_name,
            google_id=google_id,
            google_email=email,
            google_picture=picture,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


user = CRUDUser(User)
