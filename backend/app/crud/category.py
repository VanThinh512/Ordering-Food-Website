"""CRUD operations for Category model."""
from typing import Optional
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    """CRUD operations for Category model."""

    def get_by_name(self, db: Session, *, name: str) -> Optional[Category]:
        """Get category by name."""
        statement = select(Category).where(Category.name == name)
        return db.exec(statement).first()

    def get_active(self, db: Session, *, skip: int = 0, limit: int = 100):
        """Get active categories."""
        statement = (
            select(Category)
            .where(Category.is_active == True)
            .order_by(Category.sort_order)
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()


category = CRUDCategory(Category)
