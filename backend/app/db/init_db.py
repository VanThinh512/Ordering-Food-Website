"""Database initialization."""
from sqlmodel import SQLModel, Session, select

from app.db.session import engine
from app.core.security import get_password_hash
from app.core.config import settings
from app.db import base  # noqa: F401 - Import to register all models


def init_db(db: Session) -> None:
    """Initialize database with default data."""
    from app.models.user import User
    from app.utils.enums import UserRole
    
    # Create tables
    SQLModel.metadata.create_all(engine)
    
    # Check if superuser exists
    statement = select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL)
    user = db.exec(statement).first()
    
    if not user:
        # Create superuser
        user = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name=settings.FIRST_SUPERUSER_FULLNAME,
            role=UserRole.ADMIN,
            is_superuser=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Superuser created: {settings.FIRST_SUPERUSER_EMAIL}")
    else:
        print(f"Superuser already exists: {settings.FIRST_SUPERUSER_EMAIL}")
