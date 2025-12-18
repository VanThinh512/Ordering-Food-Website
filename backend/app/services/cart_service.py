"""Cart service - Business logic for cart operations."""
from typing import Optional
from sqlmodel import Session
from fastapi import HTTPException, status

from app.crud.cart import cart as cart_crud
from app.crud.product import product as product_crud
from app.models.cart import Cart, CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate


class CartService:
    """Service for cart business logic."""

    @staticmethod
    def get_or_create_cart(db: Session, user_id: int) -> Cart:
        """Get or create cart for user."""
        return cart_crud.get_or_create(db, user_id=user_id)

    @staticmethod
    def add_item_to_cart(
        db: Session, user_id: int, item_in: CartItemCreate
    ) -> Cart:
        """Add item to cart with validation."""
        # Check if product exists and is available
        product = product_crud.get(db, id=item_in.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        
        if not product.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product is not available",
            )
        
        # Check stock if managed
        if product.stock_quantity is not None:
            if product.stock_quantity < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough stock. Available: {product.stock_quantity}",
                )
        
        # Get or create cart
        cart = cart_crud.get_or_create(db, user_id=user_id)
        
        # Add item to cart
        cart_crud.add_item(
            db, cart_id=cart.id, obj_in=item_in, price=product.price
        )
        
        # Return updated cart
        db.refresh(cart)
        return cart

    @staticmethod
    def update_cart_item(
        db: Session, user_id: int, item_id: int, item_in: CartItemUpdate
    ) -> Cart:
        """Update cart item quantity."""
        cart = cart_crud.get_by_user(db, user_id=user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )
        
        # Verify item belongs to user's cart
        item = db.get(CartItem, item_id)
        if not item or item.cart_id != cart.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )
        
        # Check stock if managed
        if item.product.stock_quantity is not None:
            if item.product.stock_quantity < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough stock. Available: {item.product.stock_quantity}",
                )
        
        # Update item
        cart_crud.update_item(db, item_id=item_id, quantity=item_in.quantity)
        
        db.refresh(cart)
        return cart

    @staticmethod
    def remove_cart_item(db: Session, user_id: int, item_id: int) -> Cart:
        """Remove item from cart."""
        cart = cart_crud.get_by_user(db, user_id=user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )
        
        # Verify item belongs to user's cart
        item = db.get(CartItem, item_id)
        if not item or item.cart_id != cart.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )
        
        success = cart_crud.remove_item(db, item_id=item_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )
        
        db.refresh(cart)
        return cart

    @staticmethod
    def clear_cart(db: Session, user_id: int) -> Cart:
        """Clear all items from cart."""
        cart = cart_crud.get_by_user(db, user_id=user_id)
        if not cart:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )
        
        cart_crud.clear_cart(db, cart_id=cart.id)
        db.refresh(cart)
        return cart

    @staticmethod
    def get_cart_total(cart: Cart) -> float:
        """Calculate total amount for cart."""
        total = 0.0
        for item in cart.items:
            total += item.price_at_time * item.quantity
        return total


cart_service = CartService()
