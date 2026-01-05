# Tài Liệu Tham Khảo API Endpoints

## Base URL
```
http://localhost:8000/api/v1
```

## Xác Thực (Authentication)

### Đăng Ký Người Dùng
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "phone": "+84123456789",
  "role": "student",
  "student_id": "SV001",
  "class_name": "CS101"
}

Response: 201 Created
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "role": "student",
  "is_active": true,
  "is_superuser": false,
  ...
}
```

### Đăng Nhập
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

### Lấy Thông Tin Người Dùng Hiện Tại
```http
GET /auth/me
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  ...
}
```

---

## Người Dùng (Users) - Chỉ Admin

### Danh Sách Người Dùng
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

### Tạo Người Dùng
```http
POST /users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "Người Dùng Mới",
  "role": "staff"
}

Response: 201 Created
```

### Lấy Người Dùng Theo ID
```http
GET /users/{user_id}
Authorization: Bearer {token}

Response: 200 OK
```

### Cập Nhật Người Dùng
```http
PUT /users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "full_name": "Tên Đã Cập Nhật",
  "phone": "+84987654321"
}

Response: 200 OK
```

### Xóa Người Dùng
```http
DELETE /users/{user_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Danh Mục (Categories)

### Danh Sách Danh Mục
```http
GET /categories?skip=0&limit=100

Response: 200 OK
[
  {
    "id": 1,
    "name": "Cà phê",
    "description": "Các loại cà phê đa dạng",
    "image_url": "https://...",
    "is_active": true,
    "sort_order": 1,
    ...
  }
]
```

### Tạo Danh Mục (Chỉ Admin)
```http
POST /categories
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Cà phê",
  "description": "Các loại cà phê đa dạng",
  "image_url": "https://...",
  "sort_order": 1
}

Response: 201 Created
```

### Lấy Danh Mục
```http
GET /categories/{category_id}

Response: 200 OK
```

### Cập Nhật Danh Mục (Chỉ Admin)
```http
PUT /categories/{category_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Tên Đã Cập Nhật",
  "description": "Mô tả đã cập nhật"
}

Response: 200 OK
```

### Xóa Danh Mục (Chỉ Admin)
```http
DELETE /categories/{category_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Sản Phẩm (Products)

### Danh Sách Sản Phẩm
```http
GET /products?skip=0&limit=100&category_id=1&available_only=true

Response: 200 OK
[
  {
    "id": 1,
    "name": "Cappuccino",
    "description": "Espresso với sữa tươi",
    "price": 45000,
    "category_id": 1,
    "image_url": "https://...",
    "is_available": true,
    "stock_quantity": 100,
    ...
  }
]
```

### Tìm Kiếm Sản Phẩm
```http
GET /products/search?q=coffee&skip=0&limit=100

Response: 200 OK
```

### Tạo Sản Phẩm (Chỉ Admin)
```http
POST /products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Cappuccino",
  "description": "Espresso với sữa tươi",
  "price": 45000,
  "category_id": 1,
  "image_url": "https://...",
  "stock_quantity": 100,
  "preparation_time": 5,
  "calories": 120
}

Response: 201 Created
```

### Lấy Sản Phẩm
```http
GET /products/{product_id}

Response: 200 OK
```

### Cập Nhật Sản Phẩm (Chỉ Admin)
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

### Xóa Sản Phẩm (Chỉ Admin)
```http
DELETE /products/{product_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Giỏ Hàng (Cart)

### Lấy Giỏ Hàng
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

### Thêm Sản Phẩm Vào Giỏ
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

### Cập Nhật Sản Phẩm Trong Giỏ
```http
PUT /cart/items/{item_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}

Response: 200 OK
```

### Xóa Sản Phẩm Khỏi Giỏ
```http
DELETE /cart/items/{item_id}
Authorization: Bearer {token}

Response: 200 OK
```

### Xóa Toàn Bộ Giỏ Hàng
```http
DELETE /cart
Authorization: Bearer {token}

Response: 200 OK
```

---

## Đơn Hàng (Orders)

### Danh Sách Đơn Hàng
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

### Tạo Đơn Hàng Từ Giỏ
```http
POST /orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "table_id": 1,
  "notes": "Không đường",
  "delivery_type": "dine-in"
}

Response: 201 Created
```

### Lấy Đơn Hàng
```http
GET /orders/{order_id}
Authorization: Bearer {token}

Response: 200 OK
```

### Cập Nhật Trạng Thái Đơn Hàng (Chỉ Admin)
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

### Xóa Đơn Hàng (Chỉ Admin)
```http
DELETE /orders/{order_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Bàn (Tables)

### Danh Sách Bàn
```http
GET /tables?skip=0&limit=100&status_filter=available

Response: 200 OK
[
  {
    "id": 1,
    "table_number": "T01",
    "capacity": 4,
    "status": "available",
    "location": "Tầng trệt",
    "is_active": true,
    ...
  }
]
```

### Lấy Bàn Trống
```http
GET /tables/available?skip=0&limit=100

Response: 200 OK
```

### Tạo Bàn (Chỉ Admin)
```http
POST /tables
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "table_number": "T01",
  "capacity": 4,
  "location": "Tầng trệt"
}

Response: 201 Created
```

### Lấy Bàn
```http
GET /tables/{table_id}

Response: 200 OK
```

### Cập Nhật Bàn (Chỉ Admin)
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

### Xóa Bàn (Chỉ Admin)
```http
DELETE /tables/{table_id}
Authorization: Bearer {admin_token}

Response: 200 OK
```

---

## Phản Hồi Lỗi (Error Responses)

### 400 Bad Request
```json
{
  "detail": "Thông báo lỗi"
}
```

### 401 Unauthorized
```json
{
  "detail": "Không thể xác thực thông tin đăng nhập"
}
```

### 403 Forbidden
```json
{
  "detail": "Không đủ quyền"
}
```

### 404 Not Found
```json
{
  "detail": "Không tìm thấy tài nguyên"
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

## Enums (Giá Trị Cố Định)

### UserRole (Vai Trò Người Dùng)
- `admin` - Quản trị viên
- `staff` - Nhân viên
- `student` - Sinh viên/Khách hàng

### OrderStatus (Trạng Thái Đơn Hàng)
- `pending` - Đơn hàng đã đặt, chờ xác nhận
- `confirmed` - Đơn hàng đã xác nhận
- `preparing` - Đang chuẩn bị
- `ready` - Sẵn sàng lấy/giao
- `completed` - Hoàn thành
- `cancelled` - Đã hủy

### PaymentStatus (Trạng Thái Thanh Toán)
- `unpaid` - Chưa thanh toán
- `paid` - Đã thanh toán
- `refunded` - Đã hoàn tiền

### TableStatus (Trạng Thái Bàn)
- `available` - Bàn trống
- `occupied` - Đang sử dụng
- `reserved` - Đã đặt trước
