"""Statistics endpoints."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract, and_
from sqlmodel import Session, select

from app.api.deps import get_current_active_user, get_db, require_role
from app.models.user import User
from app.models.order import Order
from app.models.reservation import TableReservation
from app.utils.enums import OrderStatus, ReservationStatus, UserRole

router = APIRouter()


@router.get("/overview")
def get_statistics_overview(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.STAFF]))
):
    """
    Get overview statistics:
    - Total orders
    - Completed orders
    - Total revenue (from completed orders)
    - Total reservations
    - Active reservations
    """
    # Count total orders
    total_orders = db.exec(select(func.count(Order.id))).one()
    
    # Count completed orders
    completed_orders = db.exec(
        select(func.count(Order.id))
        .where(func.upper(Order.status) == 'COMPLETED')
    ).one()
    
    # Calculate total revenue from completed orders
    total_revenue = db.exec(
        select(func.sum(Order.total_amount))
        .where(func.upper(Order.status) == 'COMPLETED')
    ).one() or 0.0
    
    # Count total reservations
    total_reservations = db.exec(select(func.count(TableReservation.id))).one()
    
    # Count active reservations (confirmed and active)
    active_reservations = db.exec(
        select(func.count(TableReservation.id))
        .where(TableReservation.status.in_([ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE]))
    ).one()
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_revenue": round(total_revenue, 2),
        "total_reservations": total_reservations,
        "active_reservations": active_reservations
    }


@router.get("/revenue")
def get_revenue_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.STAFF])),
    year: Optional[int] = Query(None, description="Year to filter (e.g., 2024)"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month to filter (1-12)")
):
    """
    Get revenue statistics by month or year.
    Only counts completed orders.
    
    - If year and month provided: Daily revenue for that month
    - If only year provided: Monthly revenue for that year
    - If neither: Monthly revenue for current year
    """
    current_year = datetime.utcnow().year
    target_year = year or current_year
    
    # Base query - only completed orders
    base_query = select(Order).where(Order.status == OrderStatus.COMPLETED)
    
    if month is not None:
        # Daily revenue for specific month
        query = select(
            extract('day', Order.completed_at).label('day'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('order_count')
        ).where(
            and_(
                func.upper(Order.status) == 'COMPLETED',
                extract('year', Order.completed_at) == target_year,
                extract('month', Order.completed_at) == month
            )
        ).group_by(extract('day', Order.completed_at)).order_by(extract('day', Order.completed_at))
        
        results = db.exec(query).all()
        
        data = [
            {
                "day": int(row.day),
                "revenue": round(row.revenue, 2),
                "order_count": row.order_count
            }
            for row in results
        ]
        
        return {
            "period": "daily",
            "year": target_year,
            "month": month,
            "data": data
        }
    else:
        # Monthly revenue for year
        query = select(
            extract('month', Order.completed_at).label('month'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('order_count')
        ).where(
            and_(
                func.upper(Order.status) == 'COMPLETED',
                extract('year', Order.completed_at) == target_year
            )
        ).group_by(extract('month', Order.completed_at)).order_by(extract('month', Order.completed_at))
        
        results = db.exec(query).all()
        
        data = [
            {
                "month": int(row.month),
                "revenue": round(row.revenue, 2),
                "order_count": row.order_count
            }
            for row in results
        ]
        
        return {
            "period": "monthly",
            "year": target_year,
            "data": data
        }


@router.get("/orders")
def get_orders_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.STAFF])),
    year: Optional[int] = Query(None, description="Year to filter (e.g., 2024)"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month to filter (1-12)")
):
    """
    Get order count statistics by status.
    
    - If year and month provided: Statistics for that month
    - If only year provided: Statistics for that year
    - If neither: Statistics for current year
    """
    current_year = datetime.utcnow().year
    target_year = year or current_year
    
    # Build filter conditions
    filters = [extract('year', Order.created_at) == target_year]
    if month is not None:
        filters.append(extract('month', Order.created_at) == month)
    
    # Get order counts by status
    query = select(
        Order.status,
        func.count(Order.id).label('count')
    ).where(and_(*filters)).group_by(Order.status)
    
    results = db.exec(query).all()
    
    by_status = {
        status.value: 0 for status in OrderStatus
    }
    
    for row in results:
        by_status[row.status.value] = row.count
    
    return {
        "year": target_year,
        "month": month,
        "by_status": by_status,
        "total": sum(by_status.values())
    }


@router.get("/reservations")
def get_reservations_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.STAFF])),
    year: Optional[int] = Query(None, description="Year to filter (e.g., 2024)"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month to filter (1-12)")
):
    """
    Get table reservation statistics.
    
    - If year and month provided: Statistics for that month
    - If only year provided: Statistics for that year
    - If neither: Statistics for current year
    """
    current_year = datetime.utcnow().year
    target_year = year or current_year
    
    # Build filter conditions
    filters = [extract('year', TableReservation.created_at) == target_year]
    if month is not None:
        filters.append(extract('month', TableReservation.created_at) == month)
    
    # Get reservation counts by status
    query = select(
        TableReservation.status,
        func.count(TableReservation.id).label('count')
    ).where(and_(*filters)).group_by(TableReservation.status)
    
    results = db.exec(query).all()
    
    by_status = {
        status.value: 0 for status in ReservationStatus
    }
    
    for row in results:
        by_status[row.status.value] = row.count
    
    # Get daily/monthly breakdown
    if month is not None:
        # Daily reservations for the month
        breakdown_query = select(
            extract('day', TableReservation.start_time).label('day'),
            func.count(TableReservation.id).label('count')
        ).where(
            and_(*filters)
        ).group_by(extract('day', TableReservation.start_time)).order_by(extract('day', TableReservation.start_time))
        
        breakdown_results = db.exec(breakdown_query).all()
        breakdown = [
            {
                "day": int(row.day),
                "count": row.count
            }
            for row in breakdown_results
        ]
    else:
        # Monthly reservations for the year
        breakdown_query = select(
            extract('month', TableReservation.start_time).label('month'),
            func.count(TableReservation.id).label('count')
        ).where(
            extract('year', TableReservation.start_time) == target_year
        ).group_by(extract('month', TableReservation.start_time)).order_by(extract('month', TableReservation.start_time))
        
        breakdown_results = db.exec(breakdown_query).all()
        breakdown = [
            {
                "month": int(row.month),
                "count": row.count
            }
            for row in breakdown_results
        ]
    
    return {
        "year": target_year,
        "month": month,
        "by_status": by_status,
        "total": sum(by_status.values()),
        "breakdown": breakdown
    }


@router.get("/revenue-by-month")
def get_revenue_by_month(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.STAFF])),
    year: int = Query(..., description="Year to get monthly revenue")
):
    """
    Get monthly revenue for a specific year.
    Returns data for all 12 months (0 if no revenue).
    Only counts completed orders.
    """
    query = select(
        extract('month', Order.completed_at).label('month'),
        func.sum(Order.total_amount).label('revenue'),
        func.count(Order.id).label('order_count')
    ).where(
        and_(
            func.upper(Order.status) == 'COMPLETED',
            extract('year', Order.completed_at) == year
        )
    ).group_by(extract('month', Order.completed_at))
    
    results = db.exec(query).all()
    
    # Create dict with all 12 months
    monthly_data = {i: {"month": i, "revenue": 0.0, "order_count": 0} for i in range(1, 13)}
    
    # Fill in actual data
    for row in results:
        month_num = int(row.month)
        monthly_data[month_num] = {
            "month": month_num,
            "revenue": round(row.revenue, 2),
            "order_count": row.order_count
        }
    
    return {
        "year": year,
        "data": list(monthly_data.values())
    }
