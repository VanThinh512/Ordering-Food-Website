# API Endpoints Reference

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+84123456789",
  "role": "student",
  "student_id": "SV001",
  "class_name": "CS101"
}

Response: 201 Created
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "student",
  "is_active": true,
  "is_superuser": false,
  ...
}
```

### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  ...
}
```

---

## Users (Admin Only)

### List Users
```http
GET /users?skip=0&limit=100
Authorization: Bearer {admin_token}

Response: 200 OK
[
  {
    "id": 1,
    "email": "user@example.com",
    ...
  }
]
```

### Create User
```http
POST /users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User",
  "role": "staff"
}

Response: 201 Created
```

### Get User by ID
```http
GET /users/{user_id}
Authorization: Bearer {token}

Response: 200 OK
```

### Update User
```http
PUT /users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "full_name": "Updated Name",
  "phone": "+84987654321"
}

Response: 200 OK
```

### Delete User
```http
DELETE /users/{user_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Categories

### List Categories
```http
GET /categories?skip=0&limit=100

Response: 200 OK
[
  {
    "id": 1,
    "name": "Coffee",
    "description": "Various coffee drinks",
    "image_url": "https://...",
    "is_active": true,
    "sort_order": 1,
    ...
  }
]
```

### Create Category (Admin Only)
```http
POST /categories
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Coffee",
  "description": "Various coffee drinks",
  "image_url": "https://...",
  "sort_order": 1
}

Response: 201 Created
```

### Get Category
```http
GET /categories/{category_id}

Response: 200 OK
```

### Update Category (Admin Only)
```http
PUT /categories/{category_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}

Response: 200 OK
```

### Delete Category (Admin Only)
```http
DELETE /categories/{category_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Products

### List Products
```http
GET /products?skip=0&limit=100&category_id=1&available_only=true

Response: 200 OK
[
  {
    "id": 1,
    "name": "Cappuccino",
    "description": "Espresso with steamed milk",
    "price": 45000,
    "category_id": 1,
    "image_url": "https://...",
    "is_available": true,
    "stock_quantity": 100,
    ...
  }
]
```

### Search Products
```http
GET /products/search?q=coffee&skip=0&limit=100

Response: 200 OK
```

### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Cappuccino",
  "description": "Espresso with steamed milk",
  "price": 45000,
  "category_id": 1,
  "image_url": "https://...",
  "stock_quantity": 100,
  "preparation_time": 5,
  "calories": 120
}

Response: 201 Created
```

### Get Product
```http
GET /products/{product_id}

Response: 200 OK
```

### Update Product (Admin Only)
```http
PUT /products/{product_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "price": 50000,
  "is_available": true
}

Response: 200 OK
```

### Delete Product (Admin Only)
```http
DELETE /products/{product_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Cart

### Get Cart
```http
GET /cart
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "user_id": 1,
  "items": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 2,
      "price_at_time": 45000,
      ...
    }
  ],
  ...
}
```

### Add Item to Cart
```http
POST /cart/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}

Response: 201 Created
```

### Update Cart Item
```http
PUT /cart/items/{item_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}

Response: 200 OK
```

### Remove Cart Item
```http
DELETE /cart/items/{item_id}
Authorization: Bearer {token}

Response: 200 OK
```

### Clear Cart
```http
DELETE /cart
Authorization: Bearer {token}

Response: 200 OK
```

---

## Orders

### List Orders
```http
GET /orders?skip=0&limit=100&status_filter=pending
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "user_id": 1,
    "total_amount": 90000,
    "status": "pending",
    "payment_status": "unpaid",
    "delivery_type": "pickup",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 2,
        "price_at_time": 45000,
        "subtotal": 90000,
        ...
      }
    ],
    ...
  }
]
```

### Create Order from Cart
```http
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "table_id": 1,
  "notes": "No sugar please",
  "delivery_type": "dine-in"
}

Response: 201 Created
```

### Get Order
```http
GET /orders/{order_id}
Authorization: Bearer {token}

Response: 200 OK
```

### Update Order Status (Admin Only)
```http
PUT /orders/{order_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "confirmed",
  "payment_status": "paid"
}

Response: 200 OK
```

### Delete Order (Admin Only)
```http
DELETE /orders/{order_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Tables

### List Tables
```http
GET /tables?skip=0&limit=100&status_filter=available

Response: 200 OK
[
  {
    "id": 1,
    "table_number": "T01",
    "capacity": 4,
    "status": "available",
    "location": "Ground Floor",
    "is_active": true,
    ...
  }
]
```

### Get Available Tables
```http
GET /tables/available?skip=0&limit=100

Response: 200 OK
```

### Create Table (Admin Only)
```http
POST /tables
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "table_number": "T01",
  "capacity": 4,
  "location": "Ground Floor"
}

Response: 201 Created
```

### Get Table
```http
GET /tables/{table_id}

Response: 200 OK
```

### Update Table (Admin Only)
```http
PUT /tables/{table_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "occupied",
  "capacity": 6
}

Response: 200 OK
```

### Delete Table (Admin Only)
```http
DELETE /tables/{table_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Enums

### UserRole
- `admin` - Administrator
- `staff` - Staff member
- `student` - Student/Customer

### OrderStatus
- `pending` - Order placed, awaiting confirmation
- `confirmed` - Order confirmed
- `preparing` - Order being prepared
- `ready` - Order ready for pickup/delivery
- `completed` - Order completed
- `cancelled` - Order cancelled

### PaymentStatus
- `unpaid` - Not paid yet
- `paid` - Payment received
- `refunded` - Payment refunded

### TableStatus
- `available` - Table is available
- `occupied` - Table is occupied
- `reserved` - Table is reserved
