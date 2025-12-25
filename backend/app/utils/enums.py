"""Enums for the application."""
from enum import Enum


class UserRole(str, Enum):
    """User role types."""
    ADMIN = "admin"
    STAFF = "staff"
    STUDENT = "student"


class OrderStatus(str, Enum):
    """Order status types."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    """Payment status types."""
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"


class TableStatus(str, Enum):
    """Table status types."""
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"


class ReservationStatus(str, Enum):
    """Reservation status types."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
