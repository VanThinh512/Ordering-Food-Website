# WebOrder API - FastAPI Backend

A clean, well-structured FastAPI backend for an ordering food website using SQLAlchemy (via SQLModel).

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py            # API dependencies (auth, db session)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py      # Main API router
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py    # Authentication endpoints
│   │           ├── users.py   # User CRUD endpoints
│   │           ├── categories.py
│   │           ├── products.py
│   │           ├── carts.py
│   │           ├── orders.py
│   │           └── tables.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Application settings
│   │   └── security.py        # Security utilities (JWT, password hashing)
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py            # Import all models for Alembic
│   │   ├── session.py         # Database session
│   │   └── init_db.py         # Database initialization
│   ├── models/                # SQLModel database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── table.py
│   ├── schemas/               # Pydantic schemas for API
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── table.py
│   │   └── token.py
│   ├── crud/                  # CRUD operations
│   │   ├── __init__.py
│   │   ├── base.py           # Base CRUD class
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── table.py
│   └── utils/
│       ├── __init__.py
│       └── enums.py          # Application enums
├── .env                       # Environment variables
├── .env.example              # Example environment variables
├── .gitignore
├── requirements.txt
└── README.md
```

## ✨ Features

- **Clean Architecture**: Separation of concerns with models, schemas, CRUD, and API layers
- **Type Safety**: Full type hints using Pydantic and SQLModel
- **Authentication**: JWT-based authentication with password hashing
- **Authorization**: Role-based access control (Admin, Staff, Student)
- **Database**: SQLAlchemy ORM via SQLModel
- **API Documentation**: Auto-generated with Swagger UI and ReDoc
- **CORS**: Configurable CORS middleware
- **Validation**: Request/response validation with Pydantic

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: Secret key for JWT tokens

### 3. Run the Application

```bash
# Development mode with auto-reload
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access API Documentation

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get access token
- `GET /api/v1/auth/me` - Get current user info

### Users
- `GET /api/v1/users` - List users (admin only)
- `POST /api/v1/users` - Create user (admin only)
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (admin only)

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category (admin only)
- `GET /api/v1/categories/{id}` - Get category
- `PUT /api/v1/categories/{id}` - Update category (admin only)
- `DELETE /api/v1/categories/{id}` - Delete category (admin only)

### Products
- `GET /api/v1/products` - List products (with filters)
- `GET /api/v1/products/search` - Search products
- `POST /api/v1/products` - Create product (admin only)
- `GET /api/v1/products/{id}` - Get product
- `PUT /api/v1/products/{id}` - Update product (admin only)
- `DELETE /api/v1/products/{id}` - Delete product (admin only)

### Cart
- `GET /api/v1/cart` - Get current user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/{id}` - Update cart item
- `DELETE /api/v1/cart/items/{id}` - Remove cart item
- `DELETE /api/v1/cart` - Clear cart

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order from cart
- `GET /api/v1/orders/{id}` - Get order
- `PUT /api/v1/orders/{id}` - Update order status (admin only)
- `DELETE /api/v1/orders/{id}` - Delete order (admin only)

### Tables
- `GET /api/v1/tables` - List tables
- `GET /api/v1/tables/available` - Get available tables
- `POST /api/v1/tables` - Create table (admin only)
- `GET /api/v1/tables/{id}` - Get table
- `PUT /api/v1/tables/{id}` - Update table (admin only)
- `DELETE /api/v1/tables/{id}` - Delete table (admin only)

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register or login to get an access token
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your_access_token>
   ```

## 🗄️ Database Models

- **User**: User accounts with roles (admin, staff, student)
- **Category**: Product categories
- **Product**: Food/beverage items
- **Cart**: Shopping cart (one per user)
- **CartItem**: Items in a cart
- **Order**: Completed orders
- **OrderItem**: Items in an order
- **Table**: Restaurant tables for dine-in orders

## 🛠️ Development

### Code Style

- Follow PEP 8 guidelines
- Use type hints for all functions
- Document all classes and functions with docstrings
- Keep functions small and focused

### Project Conventions

- **Models**: Database models using SQLModel
- **Schemas**: Pydantic models for API request/response
- **CRUD**: Database operations separated from API logic
- **Endpoints**: API routes organized by resource

## 📝 License

This project is for educational purposes.
