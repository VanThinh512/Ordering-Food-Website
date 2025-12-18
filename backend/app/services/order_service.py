"""Order service - Business logic for order operations."""
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session
from fastapi import HTTPException, status

from app.crud.order import order as order_crud
from app.crud.cart import cart as cart_crud
from app.crud.table import table as table_crud
from app.crud.product import product as product_crud
from app.models.order import Order
from app.schemas.order import OrderCreate
from app.utils.enums import OrderStatus, PaymentStatus, TableStatus


class OrderService:
    """Service for order business logic."""

    @staticmethod
    def create_order_from_cart(
        db: Session, user_id: int, order_in: OrderCreate
    ) -> Order:
        """Create order from user's cart."""
        # Get user's cart
        cart = cart_crud.get_by_user(db, user_id=user_id)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )
        
        # Validate all products are still available
        for cart_item in cart.items:
            product = product_crud.get(db, id=cart_item.product_id)
            if not product or not product.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product {cart_item.product_id} is no longer available",
                )
            
            # Check stock
            if product.stock_quantity is not None:
                if product.stock_quantity < cart_item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Not enough stock for {product.name}. Available: {product.stock_quantity}",
                    )
        
        # Validate table if dine-in
        if order_in.table_id:
            table = table_crud.get(db, id=order_in.table_id)
            if not table:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Table not found",
                )
            if table.status != TableStatus.AVAILABLE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Table is not available",
                )
        
        # Calculate total and prepare order items
        total_amount = 0.0
        order_items = []
        
        for cart_item in cart.items:
            subtotal = cart_item.price_at_time * cart_item.quantity
            total_amount += subtotal
            
            order_items.append({
                "product_id": cart_item.product_id,
                "quantity": cart_item.quantity,
                "price_at_time": cart_item.price_at_time,
                "subtotal": subtotal,
                "notes": None,
            })
        
        # Create order
        order = order_crud.create_with_items(
            db,
            user_id=user_id,
            obj_in=order_in,
            items=order_items,
            total_amount=total_amount,
        )
        
        # Update table status if dine-in
        if order_in.table_id:
            table_crud.update_status(
                db, table_id=order_in.table_id, status=TableStatus.OCCUPIED
            )
        
        # Update stock quantities
        for cart_item in cart.items:
            product = product_crud.get(db, id=cart_item.product_id)
            if product.stock_quantity is not None:
                product.stock_quantity -= cart_item.quantity
                db.add(product)
        
        db.commit()
        
        # Clear cart
        cart_crud.clear_cart(db, cart_id=cart.id)
        
        return order

    @staticmethod
    def update_order_status(
        db: Session, order_id: int, new_status: OrderStatus
    ) -> Order:
        """Update order status with business logic."""
        order = order_crud.get(db, id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )
        
        # Update status
        order = order_crud.update_status(db, order_id=order_id, status=new_status)
        
        # If completed, release table and update payment
        if new_status == OrderStatus.COMPLETED:
            if order.table_id:
                table_crud.update_status(
                    db, table_id=order.table_id, status=TableStatus.AVAILABLE
                )
            
            # Auto-mark as paid when completed
            order.payment_status = PaymentStatus.PAID
            order.updated_at = datetime.utcnow()
            db.add(order)
            db.commit()
            db.refresh(order)
        
        # If cancelled, release table and restore stock
        elif new_status == OrderStatus.CANCELLED:
            if order.table_id:
                table_crud.update_status(
                    db, table_id=order.table_id, status=TableStatus.AVAILABLE
                )
            
            # Restore stock
            for order_item in order.items:
                product = product_crud.get(db, id=order_item.product_id)
                if product and product.stock_quantity is not None:
                    product.stock_quantity += order_item.quantity
                    db.add(product)
            
            db.commit()
        
        return order

    @staticmethod
    def get_user_orders(
        db: Session, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        """Get orders for a specific user."""
        return order_crud.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

    @staticmethod
    def get_orders_by_status(
        db: Session, status: OrderStatus, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        """Get orders by status."""
        return order_crud.get_by_status(db, status=status, skip=skip, limit=limit)

    @staticmethod
    def calculate_order_total(order: Order) -> float:
        """Calculate total amount for order."""
        total = 0.0
        for item in order.items:
            total += item.subtotal
        return total


order_service = OrderService()
