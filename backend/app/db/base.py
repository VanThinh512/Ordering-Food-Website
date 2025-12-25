"""Base class for all models."""
# Import all models here for Alembic to detect them
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.table import Table
from app.models.reservation import TableReservation
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem

__all__ = [
    "User",
    "Category",
    "Product",
    "Table",
    "TableReservation",
    "Cart",
    "CartItem",
    "Order",
    "OrderItem",
]
