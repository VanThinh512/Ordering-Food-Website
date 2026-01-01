"""Order endpoints."""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from pydantic import BaseModel

from app.api.deps import get_current_active_user, get_current_active_superuser, get_current_active_admin_or_staff
from app.crud.order import order as order_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import Order, OrderCreate, OrderUpdate, OrderStatusUpdate
from app.utils.enums import OrderStatus, PaymentStatus
from app.services.order_service import order_service


router = APIRouter()


@router.get("/", response_model=List[Order])
def read_orders(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status_filter: OrderStatus = Query(None, description="Filter by order status"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Retrieve orders."""
    # Admin and staff can see all orders, customers can only see their own
    from app.utils.enums import UserRole
    if current_user.is_superuser or current_user.role == UserRole.STAFF:
        if status_filter:
            orders = order_crud.get_by_status(db, status=status_filter, skip=skip, limit=limit)
        else:
            orders = order_crud.get_multi(db, skip=skip, limit=limit)
    else:
        orders = order_crud.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    
    return orders


@router.post("/", response_model=Order, status_code=status.HTTP_201_CREATED)
def create_order(
    *,
    db: Session = Depends(get_db),
    order_in: OrderCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Create order from cart."""
    order = order_service.create_order_from_cart(db, user_id=current_user.id, order_in=order_in)
    return order



@router.get("/{order_id}", response_model=Order)
def read_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get order by ID."""
    order = order_crud.get(db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    # Check permissions
    if order.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    return order


@router.put("/{order_id}", response_model=Order)
def update_order(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    order_in: OrderUpdate,
    current_user: User = Depends(get_current_active_admin_or_staff),
) -> Any:
    """Update order status (admin and staff only)."""
    order = order_crud.get(db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    # If status is being updated, use the service method
    if order_in.status:
        return order_service.update_order_status(db, order_id=order_id, new_status=order_in.status)

    order = order_crud.update(db, db_obj=order, obj_in=order_in)
    return order


@router.patch("/{order_id}/status", response_model=Order)
def update_order_status(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    status_in: OrderStatusUpdate,
    current_user: User = Depends(get_current_active_admin_or_staff),
) -> Any:
    """Patch endpoint dedicated to status updates (admin and staff only)."""
    order = order_service.update_order_status(db, order_id=order_id, new_status=status_in.status)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return order


@router.post("/{order_id}/cancel", response_model=Order)
def cancel_order(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Allow users to cancel their own pending/confirmed orders."""
    order = order_crud.get(db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Permission check
    if order.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    if order.status in (OrderStatus.CANCELLED, OrderStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be cancelled in its current state",
        )

    allowed_statuses = {
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
    }
    if order.status not in allowed_statuses and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be cancelled at this stage",
        )

    order = order_service.update_order_status(
        db, order_id=order_id, new_status=OrderStatus.CANCELLED
    )
    return order


@router.delete("/{order_id}", response_model=Order)
def delete_order(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    current_user: User = Depends(get_current_active_admin_or_staff),
) -> Any:
    """Delete an order (admin and staff only)."""
    order = order_crud.get(db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    order = order_crud.delete(db, id=order_id)
    return order


class VerifyPaymentRequest(BaseModel):
    """Payment verification request."""
    transfer_code: str


@router.post("/{order_id}/verify-payment", response_model=Order)
def verify_payment(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    payment_data: VerifyPaymentRequest,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Verify payment for an order (manual verification)."""
    order = order_crud.get(db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    # Only order owner, admin, or staff can verify
    from app.utils.enums import UserRole
    if order.user_id != current_user.id and not current_user.is_superuser and current_user.role != UserRole.STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Update payment info
    order.bank_transfer_code = payment_data.transfer_code
    order.bank_transfer_verified = True
    order.payment_status = PaymentStatus.PAID
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return order


@router.post("/{order_id}/mark-paid", response_model=Order)
def mark_order_paid(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    current_user: User = Depends(get_current_active_admin_or_staff),
) -> Any:
    """Mark order as paid (admin and staff only)."""
    order = order_crud.get(db, id=order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    order.payment_status = PaymentStatus.PAID
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return order

