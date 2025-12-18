"""CRUD operations for Cart model."""
from typing import Optional
from sqlmodel import Session, select

from app.crud.base import CRUDBase
from app.models.cart import Cart, CartItem
from app.schemas.cart import CartCreate, CartItemCreate


class CRUDCart(CRUDBase[Cart, CartCreate, dict]):
    """CRUD operations for Cart model."""

    def get_by_user(self, db: Session, *, user_id: int) -> Optional[Cart]:
        """Get cart by user ID."""
        statement = select(Cart).where(Cart.user_id == user_id)
        return db.exec(statement).first()

    def get_or_create(self, db: Session, *, user_id: int) -> Cart:
        """Get or create cart for user."""
        cart = self.get_by_user(db, user_id=user_id)
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    def add_item(
        self, db: Session, *, cart_id: int, obj_in: CartItemCreate, price: float
    ) -> CartItem:
        """Add item to cart."""
        # Check if item already exists
        statement = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_id == obj_in.product_id
        )
        existing_item = db.exec(statement).first()

        if existing_item:
            # Update quantity
            existing_item.quantity += obj_in.quantity
            db.add(existing_item)
            db.commit()
            db.refresh(existing_item)
            return existing_item
        else:
            # Create new item
            cart_item = CartItem(
                cart_id=cart_id,
                product_id=obj_in.product_id,
                quantity=obj_in.quantity,
                price_at_time=price
            )
            db.add(cart_item)
            db.commit()
            db.refresh(cart_item)
            return cart_item

    def update_item(
        self, db: Session, *, item_id: int, quantity: int
    ) -> Optional[CartItem]:
        """Update cart item quantity."""
        item = db.get(CartItem, item_id)
        if item:
            item.quantity = quantity
            db.add(item)
            db.commit()
            db.refresh(item)
        return item

    def remove_item(self, db: Session, *, item_id: int) -> bool:
        """Remove item from cart."""
        item = db.get(CartItem, item_id)
        if item:
            db.delete(item)
            db.commit()
            return True
        return False

    def clear_cart(self, db: Session, *, cart_id: int) -> bool:
        """Clear all items from cart."""
        statement = select(CartItem).where(CartItem.cart_id == cart_id)
        items = db.exec(statement).all()
        for item in items:
            db.delete(item)
        db.commit()
        return True


cart = CRUDCart(Cart)
