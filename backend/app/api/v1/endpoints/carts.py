"""Cart endpoints."""
from typing import Any
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.cart import Cart, CartItemCreate, CartItemUpdate
from app.services.cart_service import cart_service

router = APIRouter()


@router.get("/", response_model=Cart)
def read_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user's cart."""
    cart = cart_service.get_or_create_cart(db, user_id=current_user.id)
    return cart


@router.post("/items", response_model=Cart, status_code=201)
def add_item_to_cart(
    *,
    db: Session = Depends(get_db),
    item_in: CartItemCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Add item to cart."""
    cart = cart_service.add_item_to_cart(db, user_id=current_user.id, item_in=item_in)
    return cart


@router.put("/items/{item_id}", response_model=Cart)
def update_cart_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    item_in: CartItemUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update cart item quantity."""
    cart = cart_service.update_cart_item(
        db, user_id=current_user.id, item_id=item_id, item_in=item_in
    )
    return cart


@router.delete("/items/{item_id}", response_model=Cart)
def remove_cart_item(
    *,
    db: Session = Depends(get_db),
    item_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Remove item from cart."""
    cart = cart_service.remove_cart_item(db, user_id=current_user.id, item_id=item_id)
    return cart


@router.delete("/", response_model=Cart)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Clear all items from cart."""
    cart = cart_service.clear_cart(db, user_id=current_user.id)
    return cart
