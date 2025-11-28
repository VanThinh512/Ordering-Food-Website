# 📊 Database Models Documentation

## Overview
Hệ thống WebOrder sử dụng **SQLModel** (kết hợp SQLAlchemy + Pydantic) để định nghĩa models theo phương pháp **code-first**.

---

## 🗂️ Models Structure

### 1. **User** - Người dùng
**Table:** `users`

**Fields:**
- `id` (PK): ID tự động tăng
- `email`: Email đăng nhập (unique)
- `hashed_password`: Mật khẩu đã hash
- `full_name`: Họ tên đầy đủ
- `phone`: Số điện thoại (optional)
- `role`: Vai trò (admin/staff/student)
- `is_active`: Tài khoản có hoạt động không
- `is_superuser`: Có phải superuser không
- `student_id`: Mã sinh viên (optional, cho student)
- `class_name`: Lớp (optional, cho student)
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật

**Relationships:**
- `carts`: Giỏ hàng của user
- `orders`: Đơn hàng của user

**Roles:**
- `ADMIN`: Quản trị viên (full access)
- `STAFF`: Nhân viên (quản lý đơn hàng, menu)
- `STUDENT`: Sinh viên (đặt hàng)

---

### 2. **Category** - Danh mục
**Table:** `categories`

**Fields:**
- `id` (PK): ID tự động tăng
- `name`: Tên danh mục (unique)
- `description`: Mô tả
- `image_url`: URL hình ảnh
- `is_active`: Có hoạt động không
- `sort_order`: Thứ tự sắp xếp
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật

**Relationships:**
- `products`: Các sản phẩm trong danh mục

**Examples:** Coffee, Tea, Food, Snacks, Beverages

---

### 3. **Product** - Sản phẩm
**Table:** `products`

**Fields:**
- `id` (PK): ID tự động tăng
- `name`: Tên sản phẩm
- `description`: Mô tả chi tiết
- `price`: Giá (>= 0)
- `category_id` (FK): ID danh mục
- `image_url`: URL hình ảnh
- `is_available`: Còn hàng không
- `stock_quantity`: Số lượng tồn kho (optional)
- `preparation_time`: Thời gian chuẩn bị (phút)
- `calories`: Lượng calo (optional)
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật

**Relationships:**
- `category`: Danh mục của sản phẩm
- `cart_items`: Trong giỏ hàng
- `order_items`: Trong đơn hàng

---

### 4. **Table** - Bàn
**Table:** `tables`

**Fields:**
- `id` (PK): ID tự động tăng
- `table_number`: Số bàn (unique)
- `capacity`: Số chỗ ngồi
- `status`: Trạng thái (available/occupied/reserved)
- `location`: Vị trí (VD: "Tầng 1", "Tầng 2")
- `is_active`: Có hoạt động không
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật

**Relationships:**
- `orders`: Đơn hàng tại bàn này

**Statuses:**
- `AVAILABLE`: Bàn trống
- `OCCUPIED`: Đang có khách
- `RESERVED`: Đã đặt trước

---

### 5. **Cart** - Giỏ hàng
**Table:** `carts`

**Fields:**
- `id` (PK): ID tự động tăng
- `user_id` (FK): ID người dùng (unique - mỗi user 1 cart)
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật

**Relationships:**
- `user`: Người dùng sở hữu
- `items`: Các sản phẩm trong giỏ

**Note:** Mỗi user chỉ có 1 cart duy nhất

---

### 6. **CartItem** - Sản phẩm trong giỏ
**Table:** `cart_items`

**Fields:**
- `id` (PK): ID tự động tăng
- `cart_id` (FK): ID giỏ hàng
- `product_id` (FK): ID sản phẩm
- `quantity`: Số lượng (>= 1)
- `price_at_time`: Giá tại thời điểm thêm vào giỏ
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật

**Relationships:**
- `cart`: Giỏ hàng chứa item
- `product`: Sản phẩm

---

### 7. **Order** - Đơn hàng
**Table:** `orders`

**Fields:**
- `id` (PK): ID tự động tăng
- `user_id` (FK): ID người đặt
- `table_id` (FK, optional): ID bàn (nếu dine-in)
- `total_amount`: Tổng tiền
- `status`: Trạng thái đơn hàng
- `payment_status`: Trạng thái thanh toán
- `notes`: Ghi chú
- `delivery_type`: Loại giao hàng (pickup/dine-in/delivery)
- `created_at`: Ngày tạo
- `updated_at`: Ngày cập nhật
- `completed_at`: Ngày hoàn thành

**Relationships:**
- `user`: Người đặt hàng
- `table`: Bàn (nếu có)
- `items`: Các sản phẩm trong đơn

**Order Statuses:**
- `PENDING`: Chờ xác nhận
- `CONFIRMED`: Đã xác nhận
- `PREPARING`: Đang chuẩn bị
- `READY`: Sẵn sàng
- `COMPLETED`: Đã hoàn thành
- `CANCELLED`: Đã hủy

**Payment Statuses:**
- `UNPAID`: Chưa thanh toán
- `PAID`: Đã thanh toán
- `REFUNDED`: Đã hoàn tiền

---

### 8. **OrderItem** - Sản phẩm trong đơn hàng
**Table:** `order_items`

**Fields:**
- `id` (PK): ID tự động tăng
- `order_id` (FK): ID đơn hàng
- `product_id` (FK): ID sản phẩm
- `quantity`: Số lượng (>= 1)
- `price_at_time`: Giá tại thời điểm đặt
- `subtotal`: Thành tiền (quantity × price_at_time)
- `notes`: Ghi chú (VD: "Không đá", "Ít đường")
- `created_at`: Ngày tạo

**Relationships:**
- `order`: Đơn hàng chứa item
- `product`: Sản phẩm

---

## 📈 Entity Relationship Diagram (ERD)

```
User (1) ----< (M) Cart (1) ----< (M) CartItem >---- (M) Product (M) >---- (1) Category
  |                                                          |
  |                                                          |
  +------------< (M) Order (M) >---- (0-1) Table            |
                    |                                        |
                    +----------< (M) OrderItem >------------+
```

---

## 🔑 Key Design Decisions

1. **Price History**: `price_at_time` field lưu giá tại thời điểm thêm vào cart/order
   - Đảm bảo order history chính xác khi giá thay đổi

2. **Soft Delete**: Sử dụng `is_active` thay vì xóa trực tiếp
   - Giữ lại dữ liệu lịch sử

3. **One Cart Per User**: `user_id` là unique trong `carts`
   - Đơn giản hóa logic

4. **Cascade Delete**: Cart items và Order items tự động xóa khi xóa Cart/Order
   - Đảm bảo data integrity

5. **Optional Table**: Hỗ trợ cả pickup và dine-in
   - `table_id` có thể null

---

## 🧪 Next Steps

1. **Generate Migration:**
   ```bash
   alembic revision --autogenerate -m "Initial models"
   ```

2. **Apply Migration:**
   ```bash
   alembic upgrade head
   ```

3. **Verify Tables:**
   - Check SQL Server Management Studio
   - All tables should be created with correct relationships

---

## 📝 Notes

- Tất cả datetime fields sử dụng UTC
- Indexes được tạo cho foreign keys và các fields thường query
- Enums được implement bằng Python Enum và store dưới dạng string trong DB
- SQLModel tự động tạo constraints (foreign keys, unique, etc.)

