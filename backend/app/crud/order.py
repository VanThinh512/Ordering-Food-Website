"""CRUD operations for Order model."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate
from app.utils.enums import OrderStatus, PaymentMethod


class CRUDOrder(CRUDBase[Order, OrderCreate, dict]):
    """CRUD operations for Order model."""

    def _with_related(self, statement):
        """Ensure table, user, and items are eager-loaded."""
        return statement.options(
            selectinload(Order.table),
            selectinload(Order.user),
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.reservation),
        )

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        statement = (
            self._with_related(select(Order))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get(self, db: Session, id: int) -> Optional[Order]:
        statement = self._with_related(select(Order).where(Order.id == id))
        return db.exec(statement).first()

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        """Get orders by user."""
        statement = (
            self._with_related(select(Order))
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_by_status(
        self, db: Session, *, status: OrderStatus, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        """Get orders by status."""
        statement = (
            self._with_related(select(Order))
            .where(Order.status == status)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def create_with_items(
        self,
        db: Session,
        *,
        user_id: int,
        obj_in: OrderCreate,
        items: List[dict],
        total_amount: float
    ) -> Order:
        """Create order with items."""
        # Create order
        order = Order(
            user_id=user_id,
            table_id=obj_in.table_id,
            total_amount=total_amount,
            notes=obj_in.notes,
            delivery_type=obj_in.delivery_type,
            payment_method=obj_in.payment_method or PaymentMethod.CASH,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        # Create order items
        for item_data in items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                price_at_time=item_data["price_at_time"],
                subtotal=item_data["subtotal"],
                notes=item_data.get("notes"),
            )
            db.add(order_item)

        db.commit()
        db.refresh(order)
        return order

    def update_status(
        self, db: Session, *, order_id: int, status: OrderStatus
    ) -> Optional[Order]:
        """Update order status."""
        order = super().get(db, id=order_id)
        if order:
            order.status = status
            order.updated_at = datetime.utcnow()
            
            if status == OrderStatus.COMPLETED:
                order.completed_at = datetime.utcnow()
            
            db.add(order)
            db.commit()
            db.refresh(order)
        return order


order = CRUDOrder(Order)
