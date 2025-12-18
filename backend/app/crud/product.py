"""CRUD operations for Product model."""
from typing import List
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    """CRUD operations for Product model."""

    def get_by_category(
        self, db: Session, *, category_id: int, skip: int = 0, limit: int = 100
    ) -> List[Product]:
        """Get products by category."""
        statement = (
            select(Product)
            .where(Product.category_id == category_id)
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_available(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Product]:
        """Get available products."""
        statement = (
            select(Product)
            .where(Product.is_available == True)
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def search_by_name(
        self, db: Session, *, name: str, skip: int = 0, limit: int = 100
    ) -> List[Product]:
        """Search products by name."""
        statement = (
            select(Product)
            .where(Product.name.contains(name))
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()


product = CRUDProduct(Product)
