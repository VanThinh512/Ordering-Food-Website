"""
Database models using SQLModel (SQLAlchemy + Pydantic).
All models are code-first and will be used to generate database schema via Alembic.
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum

from sqlmodel import SQLModel, Field, Relationship


# ==================== ENUMS ====================

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


# ==================== USER MODEL ====================

class User(SQLModel, table=True):
    """User model - supports admin, staff, and student roles."""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    full_name: str = Field(max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    
    role: UserRole = Field(default=UserRole.STUDENT)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    
    # Student-specific fields (optional)
    student_id: Optional[str] = Field(default=None, max_length=50, index=True)
    class_name: Optional[str] = Field(default=None, max_length=100)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    carts: List["Cart"] = Relationship(back_populates="user")
    orders: List["Order"] = Relationship(back_populates="user")


# ==================== CATEGORY MODEL ====================

class Category(SQLModel, table=True):
    """Product category model (e.g., Coffee, Tea, Food, Snacks)."""
    __tablename__ = "categories"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, max_length=100, index=True)
    description: Optional[str] = Field(default=None, max_length=500)
    image_url: Optional[str] = Field(default=None, max_length=500)
    
    is_active: bool = Field(default=True)
    sort_order: int = Field(default=0)  # For custom ordering
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    products: List["Product"] = Relationship(back_populates="category")


# ==================== PRODUCT MODEL ====================

class Product(SQLModel, table=True):
    """Product model (food items, beverages, etc.)."""
    __tablename__ = "products"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    price: float = Field(ge=0)  # Must be >= 0
    
    category_id: int = Field(foreign_key="categories.id", index=True)
    
    image_url: Optional[str] = Field(default=None, max_length=500)
    is_available: bool = Field(default=True)
    
    # Stock management (optional)
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    
    # Additional info
    preparation_time: Optional[int] = Field(default=None)  # in minutes
    calories: Optional[int] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    category: Category = Relationship(back_populates="products")
    cart_items: List["CartItem"] = Relationship(back_populates="product")
    order_items: List["OrderItem"] = Relationship(back_populates="product")


# ==================== TABLE MODEL ====================

class Table(SQLModel, table=True):
    """Table model for dine-in orders (optional feature)."""
    __tablename__ = "tables"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    table_number: str = Field(unique=True, max_length=20, index=True)
    capacity: int = Field(ge=1)  # Number of seats
    
    status: TableStatus = Field(default=TableStatus.AVAILABLE)
    location: Optional[str] = Field(default=None, max_length=100)  # e.g., "Ground Floor", "2nd Floor"
    
    is_active: bool = Field(default=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    orders: List["Order"] = Relationship(back_populates="table")


# ==================== CART MODELS ====================

class Cart(SQLModel, table=True):
    """Shopping cart model - one cart per user."""
    __tablename__ = "carts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, index=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: User = Relationship(back_populates="carts")
    items: List["CartItem"] = Relationship(
        back_populates="cart",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class CartItem(SQLModel, table=True):
    """Cart item model - products in a cart."""
    __tablename__ = "cart_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    cart_id: int = Field(foreign_key="carts.id", index=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    
    quantity: int = Field(ge=1)  # Must be >= 1
    
    # Store price at time of adding to cart
    price_at_time: float = Field(ge=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    cart: Cart = Relationship(back_populates="items")
    product: Product = Relationship(back_populates="cart_items")


# ==================== ORDER MODELS ====================

class Order(SQLModel, table=True):
    """Order model - completed orders from carts."""
    __tablename__ = "orders"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Optional table for dine-in orders
    table_id: Optional[int] = Field(default=None, foreign_key="tables.id", index=True)
    
    # Order info
    total_amount: float = Field(ge=0)
    status: OrderStatus = Field(default=OrderStatus.PENDING, index=True)
    payment_status: PaymentStatus = Field(default=PaymentStatus.UNPAID)
    
    # Additional info
    notes: Optional[str] = Field(default=None, max_length=1000)
    delivery_type: Optional[str] = Field(default="pickup", max_length=50)  # "pickup", "dine-in", "delivery"
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: User = Relationship(back_populates="orders")
    table: Optional[Table] = Relationship(back_populates="orders")
    items: List["OrderItem"] = Relationship(
        back_populates="order",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class OrderItem(SQLModel, table=True):
    """Order item model - products in an order."""
    __tablename__ = "order_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="orders.id", index=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    
    quantity: int = Field(ge=1)  # Must be >= 1
    
    # Store price at time of order (price may change later)
    price_at_time: float = Field(ge=0)
    subtotal: float = Field(ge=0)  # quantity * price_at_time
    
    # Optional customization notes
    notes: Optional[str] = Field(default=None, max_length=500)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    order: Order = Relationship(back_populates="items")
    product: Product = Relationship(back_populates="order_items")

