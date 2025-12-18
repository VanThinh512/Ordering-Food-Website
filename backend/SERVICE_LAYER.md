# Service Layer Documentation

## 📋 Tổng Quan

**Service Layer** là tầng trung gian giữa API endpoints và CRUD operations, chứa business logic phức tạp của ứng dụng. Việc tách riêng service layer giúp:

✅ **Separation of Concerns** - Tách biệt business logic khỏi API layer
✅ **Reusability** - Logic có thể tái sử dụng ở nhiều endpoints
✅ **Testability** - Dễ dàng test business logic độc lập
✅ **Maintainability** - Code dễ bảo trì và mở rộng

---

## 🏗️ Kiến Trúc

```
API Endpoints (FastAPI)
        ↓
   Services Layer ← Business Logic
        ↓
   CRUD Operations
        ↓
   Database Models
```

---

## 📁 Cấu Trúc

```
app/services/
├── __init__.py
├── auth_service.py      # Authentication logic
├── cart_service.py      # Cart business logic
└── order_service.py     # Order business logic
```

---

## 🔐 Auth Service

**File**: `app/services/auth_service.py`

### Chức Năng

#### 1. Register User
```python
auth_service.register_user(db, user_in)
```

**Business Logic:**
- Kiểm tra email chưa tồn tại
- Kiểm tra student_id chưa tồn tại (nếu có)
- Hash password
- Tạo user mới
- Tự động tạo giỏ hàng rỗng

**Raises:**
- `400 BAD_REQUEST` - Email đã tồn tại
- `400 BAD_REQUEST` - Student ID đã tồn tại

#### 2. Login User
```python
auth_service.login_user(db, email, password)
```

**Business Logic:**
- Xác thực email và password
- Kiểm tra user active
- Tạo JWT access token
- Token hết hạn sau 30 phút (configurable)

**Returns:** `Token` object với access_token

**Raises:**
- `401 UNAUTHORIZED` - Email hoặc password sai
- `400 BAD_REQUEST` - User không active

#### 3. Get Current User
```python
auth_service.get_current_user(db, user_id)
```

**Business Logic:**
- Lấy user từ database
- Kiểm tra user active

**Raises:**
- `404 NOT_FOUND` - User không tồn tại
- `400 BAD_REQUEST` - User không active

---

## 🛒 Cart Service

**File**: `app/services/cart_service.py`

### Chức Năng

#### 1. Get or Create Cart
```python
cart_service.get_or_create_cart(db, user_id)
```

**Business Logic:**
- Tìm giỏ hàng của user
- Nếu chưa có → Tạo giỏ mới
- Return giỏ hàng

#### 2. Add Item to Cart
```python
cart_service.add_item_to_cart(db, user_id, item_in)
```

**Business Logic:**
1. Kiểm tra product tồn tại
2. Kiểm tra product available
3. Kiểm tra tồn kho (nếu có quản lý)
4. Get/Create cart
5. Nếu món đã có trong giỏ → Cộng thêm số lượng
6. Nếu món chưa có → Tạo CartItem mới
7. Lưu giá hiện tại (price_at_time)

**Validation:**
- Product phải tồn tại
- Product phải available
- Đủ tồn kho (nếu có quản lý stock)

**Raises:**
- `404 NOT_FOUND` - Product không tồn tại
- `400 BAD_REQUEST` - Product không available
- `400 BAD_REQUEST` - Không đủ tồn kho

#### 3. Update Cart Item
```python
cart_service.update_cart_item(db, user_id, item_id, item_in)
```

**Business Logic:**
1. Kiểm tra cart tồn tại
2. Kiểm tra item thuộc về cart của user
3. Kiểm tra tồn kho với số lượng mới
4. Cập nhật số lượng

**Validation:**
- Cart item phải thuộc về user
- Đủ tồn kho cho số lượng mới

**Raises:**
- `404 NOT_FOUND` - Cart hoặc item không tồn tại
- `400 BAD_REQUEST` - Không đủ tồn kho

#### 4. Remove Cart Item
```python
cart_service.remove_cart_item(db, user_id, item_id)
```

**Business Logic:**
1. Kiểm tra cart tồn tại
2. Kiểm tra item thuộc về cart của user
3. Xóa item

**Raises:**
- `404 NOT_FOUND` - Cart hoặc item không tồn tại

#### 5. Clear Cart
```python
cart_service.clear_cart(db, user_id)
```

**Business Logic:**
- Xóa tất cả items trong cart
- Giữ lại cart rỗng

#### 6. Get Cart Total
```python
cart_service.get_cart_total(cart)
```

**Business Logic:**
- Tính tổng tiền = Σ(price_at_time × quantity)

---

## 📦 Order Service

**File**: `app/services/order_service.py`

### Chức Năng

#### 1. Create Order from Cart
```python
order_service.create_order_from_cart(db, user_id, order_in)
```

**Business Logic:**
1. **Validate Cart**
   - Kiểm tra cart không rỗng
   
2. **Validate Products**
   - Tất cả products còn available
   - Đủ tồn kho cho tất cả items
   
3. **Validate Table** (nếu dine-in)
   - Table tồn tại
   - Table available
   
4. **Calculate Total**
   - Tính subtotal cho từng item
   - Tính total_amount
   
5. **Create Order**
   - Tạo Order record
   - Tạo OrderItem cho mỗi món
   
6. **Update Resources**
   - Nếu có bàn → Đổi status sang "occupied"
   - Giảm stock quantity
   
7. **Clear Cart**
   - Xóa tất cả items trong cart

**Validation:**
- Cart không rỗng
- Tất cả products available
- Đủ tồn kho
- Table available (nếu dine-in)

**Raises:**
- `400 BAD_REQUEST` - Cart rỗng
- `400 BAD_REQUEST` - Product không available
- `400 BAD_REQUEST` - Không đủ tồn kho
- `404 NOT_FOUND` - Table không tồn tại
- `400 BAD_REQUEST` - Table không available

**Side Effects:**
- Giảm stock quantity
- Đổi table status (nếu có)
- Xóa cart

#### 2. Update Order Status
```python
order_service.update_order_status(db, order_id, new_status)
```

**Business Logic:**

**Khi COMPLETED:**
1. Cập nhật status = COMPLETED
2. Lưu completed_at = thời gian hiện tại
3. Giải phóng bàn (nếu có) → status = "available"
4. Tự động đổi payment_status = "paid"

**Khi CANCELLED:**
1. Cập nhật status = CANCELLED
2. Giải phóng bàn (nếu có)
3. Hoàn lại stock quantity

**Khi status khác:**
- Chỉ cập nhật status

**Side Effects:**
- Giải phóng bàn (COMPLETED/CANCELLED)
- Hoàn stock (CANCELLED)
- Auto-mark paid (COMPLETED)

#### 3. Get User Orders
```python
order_service.get_user_orders(db, user_id, skip, limit)
```

**Business Logic:**
- Lấy danh sách orders của user
- Sắp xếp theo thời gian (mới nhất trước)
- Pagination

#### 4. Get Orders by Status
```python
order_service.get_orders_by_status(db, status, skip, limit)
```

**Business Logic:**
- Lọc orders theo status
- Pagination

#### 5. Calculate Order Total
```python
order_service.calculate_order_total(order)
```

**Business Logic:**
- Tính tổng tiền = Σ(subtotal của tất cả items)

---

## 🎯 Ví Dụ Sử Dụng

### Example 1: Đăng Ký User

```python
from app.services.auth_service import auth_service
from app.schemas.user import UserCreate

# Trong endpoint
user_in = UserCreate(
    email="student@example.com",
    password="password123",
    full_name="Nguyen Van A",
    student_id="SV001"
)

user = auth_service.register_user(db, user_in)
# → Tự động kiểm tra email, student_id, hash password
```

### Example 2: Thêm Món Vào Giỏ

```python
from app.services.cart_service import cart_service
from app.schemas.cart import CartItemCreate

# Trong endpoint
item_in = CartItemCreate(
    product_id=1,
    quantity=2
)

cart = cart_service.add_item_to_cart(db, user_id=1, item_in=item_in)
# → Tự động kiểm tra product, stock, lưu giá hiện tại
```

### Example 3: Tạo Đơn Hàng

```python
from app.services.order_service import order_service
from app.schemas.order import OrderCreate

# Trong endpoint
order_in = OrderCreate(
    table_id=5,
    delivery_type="dine-in",
    notes="Không hành"
)

order = order_service.create_order_from_cart(db, user_id=1, order_in=order_in)
# → Tự động validate, tính tiền, cập nhật bàn, giảm stock, xóa giỏ
```

### Example 4: Cập Nhật Trạng Thái Đơn

```python
from app.services.order_service import order_service
from app.utils.enums import OrderStatus

# Trong endpoint
order = order_service.update_order_status(
    db, 
    order_id=123, 
    new_status=OrderStatus.COMPLETED
)
# → Tự động giải phóng bàn, đổi payment status
```

---

## ✅ Best Practices

### 1. Service Layer Nên:
✅ Chứa business logic phức tạp
✅ Validate input data
✅ Orchestrate multiple CRUD operations
✅ Handle transactions
✅ Raise HTTPException với message rõ ràng

### 2. Service Layer Không Nên:
❌ Truy cập database trực tiếp (dùng CRUD)
❌ Parse request data (để cho Pydantic)
❌ Format response (để cho schemas)
❌ Handle HTTP-specific logic (để cho endpoints)

### 3. Error Handling
```python
# Good ✅
if not product:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Product not found"
    )

# Bad ❌
if not product:
    return None  # Endpoint phải handle
```

### 4. Transaction Management
```python
# Good ✅
def create_order_from_cart(db, user_id, order_in):
    # Multiple operations
    order = order_crud.create_with_items(...)
    table_crud.update_status(...)
    product_crud.update_stock(...)
    db.commit()  # Commit tất cả cùng lúc
    return order

# Bad ❌
def create_order_from_cart(db, user_id, order_in):
    order = order_crud.create_with_items(...)
    db.commit()  # Commit từng operation
    table_crud.update_status(...)
    db.commit()
```

---

## 🔄 Flow Diagram

### Cart Service Flow
```
User Request
    ↓
API Endpoint
    ↓
Cart Service
    ├→ Validate Product (CRUD)
    ├→ Check Stock
    ├→ Get/Create Cart (CRUD)
    ├→ Add/Update Item (CRUD)
    └→ Return Cart
    ↓
API Response
```

### Order Service Flow
```
User Request (Checkout)
    ↓
API Endpoint
    ↓
Order Service
    ├→ Validate Cart (CRUD)
    ├→ Validate Products (CRUD)
    ├→ Validate Table (CRUD)
    ├→ Calculate Total
    ├→ Create Order (CRUD)
    ├→ Update Table Status (CRUD)
    ├→ Update Stock (CRUD)
    ├→ Clear Cart (CRUD)
    └→ Return Order
    ↓
API Response
```

---

## 📊 So Sánh: Trước & Sau Service Layer

### Trước (Không có Service Layer)
```python
# Endpoint phải chứa tất cả business logic
@router.post("/cart/items")
def add_item_to_cart(...):
    # Validate product
    product = product_crud.get(db, id=item_in.product_id)
    if not product:
        raise HTTPException(...)
    if not product.is_available:
        raise HTTPException(...)
    
    # Check stock
    if product.stock_quantity < item_in.quantity:
        raise HTTPException(...)
    
    # Get cart
    cart = cart_crud.get_or_create(...)
    
    # Add item
    cart_crud.add_item(...)
    
    return cart
```

### Sau (Có Service Layer)
```python
# Endpoint gọn gàng, chỉ gọi service
@router.post("/cart/items")
def add_item_to_cart(...):
    cart = cart_service.add_item_to_cart(db, user_id, item_in)
    return cart

# Business logic trong service
class CartService:
    @staticmethod
    def add_item_to_cart(db, user_id, item_in):
        # Tất cả validation và logic ở đây
        ...
```

**Lợi ích:**
✅ Endpoint ngắn gọn, dễ đọc
✅ Logic tái sử dụng được
✅ Dễ test
✅ Dễ maintain

---

## 🧪 Testing Services

```python
# Test service độc lập với API
def test_add_item_to_cart():
    # Setup
    db = TestSession()
    user = create_test_user(db)
    product = create_test_product(db)
    
    # Execute
    item_in = CartItemCreate(product_id=product.id, quantity=2)
    cart = cart_service.add_item_to_cart(db, user.id, item_in)
    
    # Assert
    assert len(cart.items) == 1
    assert cart.items[0].quantity == 2
    assert cart.items[0].price_at_time == product.price
```

---

## 📝 Tóm Tắt

| Service | Chức Năng Chính | Business Logic |
|---------|----------------|----------------|
| **auth_service** | Authentication | Validate credentials, create tokens |
| **cart_service** | Cart management | Validate products, manage items, calculate total |
| **order_service** | Order processing | Validate cart, create orders, update resources |

**Service Layer = Business Logic + Validation + Orchestration**

---

**Version**: 1.0.0
**Last Updated**: 2025-12-18
