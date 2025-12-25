"""API v1 router."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    categories,
    products,
    carts,
    orders,
    tables,
    reservations,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(carts.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(tables.router, prefix="/tables", tags=["tables"])
api_router.include_router(reservations.router, prefix="/reservations", tags=["reservations"])
