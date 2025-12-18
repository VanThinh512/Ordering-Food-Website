# Architecture Diagram

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                    (Frontend Application)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│                   (FastAPI Endpoints)                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   Auth   │  Users   │Categories│ Products │   Cart   │  │
│  │          │          │          │          │          │  │
│  │  Orders  │  Tables  │   ...    │   ...    │   ...    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Schema Layer                            │
│                  (Pydantic Validation)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Request/Response Models, Data Validation            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer ⭐ NEW                    │
│                    (Business Logic)                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   Auth   │   Cart   │  Order   │  Future  │  Future  │  │
│  │ Service  │ Service  │ Service  │ Services │ Services │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CRUD Layer                              │
│                    (Database Operations)                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   User   │ Category │ Product  │   Cart   │  Order   │  │
│  │   CRUD   │   CRUD   │   CRUD   │   CRUD   │   CRUD   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│                    (SQLModel/SQLAlchemy)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database Models, Relationships, Queries             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│                    (SQL Server / MSSQL)                      │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

```
1. Client Request
   │
   ▼
2. FastAPI Endpoint (API Layer)
   │
   ├─► Authentication (JWT Validation)
   │
   ├─► Authorization (Role Check)
   │
   ▼
3. Schema Validation (Pydantic)
   │
   ▼
4. CRUD Operation (Business Logic)
   │
   ▼
5. Database Query (SQLModel)
   │
   ▼
6. Database (SQL Server)
   │
   ▼
7. Response (JSON)
   │
   ▼
8. Client
```

## Module Dependencies

```
app/
├── main.py ──────────────┐
│                         │
├── api/                  │
│   ├── deps.py ──────────┼─► core/security.py
│   └── v1/              │
│       ├── router.py ────┤
│       └── endpoints/ ───┼─► schemas/
│                         │   crud/
│                         │   models/
│                         │
├── core/                 │
│   ├── config.py ────────┤
│   └── security.py       │
│                         │
├── db/                   │
│   ├── session.py ───────┼─► core/config.py
│   ├── base.py ──────────┼─► models/
│   └── init_db.py ───────┼─► db/session.py
│                         │   core/security.py
│                         │
├── models/ ──────────────┼─► utils/enums.py
│                         │
├── schemas/ ─────────────┼─► utils/enums.py
│                         │
├── crud/ ────────────────┼─► models/
│   └── base.py           │   schemas/
│                         │   core/security.py
│                         │
└── utils/                │
    └── enums.py ─────────┘
```

## Database Schema

```
┌─────────────┐
│    Users    │
├─────────────┤
│ id (PK)     │
│ email       │◄─────────┐
│ password    │          │
│ role        │          │
│ ...         │          │
└─────────────┘          │
      │                  │
      │ 1:N              │ N:1
      ▼                  │
┌─────────────┐    ┌─────────────┐
│    Carts    │    │   Orders    │
├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │
│ user_id(FK) │    │ user_id(FK) │
└─────────────┘    │ table_id(FK)│
      │            │ status      │
      │ 1:N        │ ...         │
      ▼            └─────────────┘
┌─────────────┐          │
│  CartItems  │          │ 1:N
├─────────────┤          ▼
│ id (PK)     │    ┌─────────────┐
│ cart_id(FK) │    │ OrderItems  │
│product_id   │◄───┤─────────────┤
│ quantity    │    │ id (PK)     │
└─────────────┘    │ order_id(FK)│
      │            │product_id   │
      │            │ quantity    │
      │            └─────────────┘
      │ N:1              │ N:1
      ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  Products   │    │  Products   │
├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │
│category_id  │    │category_id  │
│ name        │    │ name        │
│ price       │    │ price       │
│ ...         │    │ ...         │
└─────────────┘    └─────────────┘
      │                  │
      │ N:1              │ N:1
      ▼                  ▼
┌─────────────┐    ┌─────────────┐
│ Categories  │    │ Categories  │
├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │
│ name        │    │ name        │
│ ...         │    │ ...         │
└─────────────┘    └─────────────┘

┌─────────────┐
│   Tables    │
├─────────────┤
│ id (PK)     │
│ number      │
│ status      │
│ ...         │
└─────────────┘
      ▲
      │ N:1
      │
(Orders.table_id)
```

## Authentication Flow

```
1. User Registration
   POST /api/v1/auth/register
   │
   ├─► Validate input (Pydantic)
   ├─► Check email exists
   ├─► Hash password (bcrypt)
   ├─► Create user in DB
   └─► Return user data

2. User Login
   POST /api/v1/auth/login
   │
   ├─► Validate credentials
   ├─► Verify password (bcrypt)
   ├─► Generate JWT token
   └─► Return access token

3. Protected Endpoint
   GET /api/v1/users/me
   │
   ├─► Extract JWT from header
   ├─► Verify token signature
   ├─► Decode user ID
   ├─► Fetch user from DB
   ├─► Check user is active
   └─► Return user data
```

## Order Creation Flow

```
1. Add items to cart
   POST /api/v1/cart/items
   │
   ├─► Authenticate user
   ├─► Validate product exists
   ├─► Get/Create user cart
   ├─► Add item to cart
   └─► Return updated cart

2. Create order from cart
   POST /api/v1/orders
   │
   ├─► Authenticate user
   ├─► Get user's cart
   ├─► Validate cart not empty
   ├─► Calculate total amount
   ├─► Create order
   ├─► Create order items
   ├─► Clear cart
   └─► Return order
```
