# 📋 Nghiệp Vụ Hệ Thống Đặt Đồ Ăn - WebOrder

## 🎯 Tổng Quan Hệ Thống

**WebOrder** là hệ thống đặt đồ ăn trực tuyến dành cho sinh viên và nhân viên, cho phép đặt món ăn, thức uống tại căn tin/quán ăn. Hệ thống hỗ trợ cả đặt mang đi (takeaway) và ăn tại chỗ (dine-in).

---

## 👥 Các Vai Trò Người Dùng

### 1. **Student (Sinh viên/Khách hàng)**
- Đăng ký tài khoản với email và mã sinh viên
- Xem danh sách món ăn, thức uống
- Thêm món vào giỏ hàng
- Đặt hàng và thanh toán
- Xem lịch sử đơn hàng
- Theo dõi trạng thái đơn hàng

### 2. **Staff (Nhân viên)**
- Xem danh sách đơn hàng
- Cập nhật trạng thái đơn hàng (đang chuẩn bị, sẵn sàng, hoàn thành)
- Quản lý bàn (nếu có dine-in)
- Xem báo cáo đơn hàng trong ngày

### 3. **Admin (Quản trị viên)**
- Tất cả quyền của Staff
- Quản lý danh mục sản phẩm (categories)
- Quản lý sản phẩm (thêm, sửa, xóa món ăn)
- Quản lý người dùng
- Quản lý bàn ăn
- Xem báo cáo doanh thu
- Cấu hình hệ thống

---

## 🔄 Các Luồng Nghiệp Vụ Chính

### 1️⃣ **Đăng Ký & Đăng Nhập**

#### Đăng Ký Tài Khoản
```
Bước 1: Sinh viên truy cập trang đăng ký
Bước 2: Nhập thông tin:
   - Email (bắt buộc, unique)
   - Mật khẩu (tối thiểu 6 ký tự)
   - Họ tên
   - Số điện thoại (tùy chọn)
   - Mã sinh viên (tùy chọn, unique nếu có)
   - Lớp (tùy chọn)
Bước 3: Hệ thống kiểm tra:
   - Email chưa tồn tại
   - Mã sinh viên chưa tồn tại (nếu có)
Bước 4: Tạo tài khoản với role = "student"
Bước 5: Tự động tạo giỏ hàng rỗng cho user
```

#### Đăng Nhập
```
Bước 1: Nhập email và mật khẩu
Bước 2: Hệ thống xác thực:
   - Kiểm tra email tồn tại
   - Verify mật khẩu (bcrypt)
   - Kiểm tra tài khoản active
Bước 3: Tạo JWT access token (hết hạn sau 30 phút)
Bước 4: Trả về token cho client
Bước 5: Client lưu token và gửi kèm mọi request
```

**Business Rules:**
- ✅ Email phải unique trong hệ thống
- ✅ Mã sinh viên phải unique (nếu có)
- ✅ Mật khẩu được hash bằng bcrypt
- ✅ Token hết hạn sau 30 phút (có thể cấu hình)
- ✅ Tài khoản inactive không thể đăng nhập

---

### 2️⃣ **Quản Lý Danh Mục & Sản Phẩm**

#### Tạo Danh Mục (Admin Only)
```
Bước 1: Admin tạo danh mục mới
   - Tên danh mục (unique)
   - Mô tả
   - Hình ảnh
   - Thứ tự hiển thị (sort_order)
Bước 2: Hệ thống kiểm tra tên chưa tồn tại
Bước 3: Lưu vào database
```

#### Tạo Sản Phẩm (Admin Only)
```
Bước 1: Admin chọn danh mục
Bước 2: Nhập thông tin sản phẩm:
   - Tên món
   - Mô tả
   - Giá (VNĐ)
   - Hình ảnh
   - Số lượng tồn kho (tùy chọn)
   - Thời gian chuẩn bị (phút)
   - Calories (tùy chọn)
Bước 3: Lưu vào database
Bước 4: Sản phẩm hiển thị cho khách hàng
```

**Business Rules:**
- ✅ Tên danh mục phải unique
- ✅ Giá sản phẩm >= 0
- ✅ Sản phẩm có thể tạm ngưng (is_available = false)
- ✅ Nếu có quản lý tồn kho, kiểm tra số lượng khi đặt hàng
- ✅ Danh mục có thể sắp xếp theo sort_order

---

### 3️⃣ **Mua Hàng - Luồng Chính** ⭐

#### A. Thêm Món Vào Giỏ Hàng
```
Bước 1: Khách hàng xem danh sách sản phẩm
   - Lọc theo danh mục
   - Tìm kiếm theo tên
   - Chỉ hiển thị sản phẩm available

Bước 2: Chọn món và số lượng
Bước 3: Click "Thêm vào giỏ"

Bước 4: Hệ thống xử lý:
   - Kiểm tra user đã đăng nhập
   - Kiểm tra sản phẩm còn available
   - Kiểm tra tồn kho (nếu có quản lý)
   - Lấy giá hiện tại của sản phẩm
   
Bước 5: Kiểm tra giỏ hàng:
   - Nếu chưa có giỏ → Tạo giỏ mới
   - Nếu đã có giỏ → Lấy giỏ hiện tại
   
Bước 6: Kiểm tra món trong giỏ:
   - Nếu món đã có → Cộng thêm số lượng
   - Nếu món chưa có → Tạo CartItem mới
   
Bước 7: Lưu price_at_time = giá hiện tại
   (Để tránh thay đổi giá sau này ảnh hưởng)
   
Bước 8: Cập nhật giỏ hàng
Bước 9: Trả về giỏ hàng đã cập nhật
```

#### B. Quản Lý Giỏ Hàng
```
Xem giỏ hàng:
   - Hiển thị tất cả món trong giỏ
   - Hiển thị số lượng, giá, tổng tiền từng món
   - Tính tổng tiền toàn bộ giỏ

Cập nhật số lượng:
   - Tăng/giảm số lượng món
   - Số lượng tối thiểu = 1
   - Nếu muốn xóa → Dùng chức năng xóa

Xóa món:
   - Xóa món khỏi giỏ hàng
   - Cập nhật tổng tiền

Xóa toàn bộ giỏ:
   - Xóa tất cả món trong giỏ
   - Giữ lại giỏ hàng rỗng
```

#### C. Đặt Hàng (Checkout)
```
Bước 1: Khách hàng click "Đặt hàng"

Bước 2: Hệ thống kiểm tra:
   - User đã đăng nhập
   - Giỏ hàng không rỗng
   - Tất cả sản phẩm còn available
   - Đủ tồn kho (nếu có quản lý)

Bước 3: Khách hàng chọn:
   - Loại đơn: Mang đi / Ăn tại chỗ
   - Nếu ăn tại chỗ → Chọn bàn (từ danh sách bàn available)
   - Ghi chú (tùy chọn): "Không đường", "Ít đá", v.v.

Bước 4: Hệ thống tính toán:
   - Duyệt qua tất cả CartItem
   - Tính subtotal = price_at_time × quantity
   - Tính total_amount = tổng tất cả subtotal

Bước 5: Tạo Order:
   - user_id = user hiện tại
   - table_id = bàn đã chọn (nếu dine-in)
   - total_amount = tổng tiền
   - status = "pending"
   - payment_status = "unpaid"
   - delivery_type = "pickup" hoặc "dine-in"
   - notes = ghi chú của khách

Bước 6: Tạo OrderItem cho mỗi món:
   - product_id
   - quantity
   - price_at_time (giá tại thời điểm đặt)
   - subtotal
   - notes (ghi chú riêng cho món, nếu có)

Bước 7: Cập nhật trạng thái:
   - Nếu chọn bàn → Cập nhật bàn = "occupied"
   - Giảm tồn kho (nếu có quản lý)

Bước 8: Xóa toàn bộ giỏ hàng

Bước 9: Trả về Order đã tạo

Bước 10: Gửi thông báo cho nhân viên (nếu có)
```

**Business Rules:**
- ✅ Giỏ hàng phải có ít nhất 1 món
- ✅ Tất cả món phải còn available
- ✅ Giá được lưu tại thời điểm thêm vào giỏ (price_at_time)
- ✅ Một user chỉ có một giỏ hàng
- ✅ Giỏ hàng được xóa sau khi đặt hàng thành công
- ✅ Nếu chọn bàn, bàn phải ở trạng thái "available"

---

### 4️⃣ **Xử Lý Đơn Hàng (Staff/Admin)**

#### Quy Trình Xử Lý
```
1. PENDING (Chờ xác nhận)
   ↓
   Staff xác nhận đơn hàng
   ↓
2. CONFIRMED (Đã xác nhận)
   ↓
   Bắt đầu chuẩn bị món
   ↓
3. PREPARING (Đang chuẩn bị)
   ↓
   Món đã chuẩn bị xong
   ↓
4. READY (Sẵn sàng)
   ↓
   Khách nhận món / Phục vụ xong
   ↓
5. COMPLETED (Hoàn thành)

Hoặc có thể:
   ANY STATE → CANCELLED (Hủy đơn)
```

#### Cập Nhật Trạng Thái
```
Bước 1: Staff/Admin xem danh sách đơn hàng
   - Lọc theo trạng thái
   - Sắp xếp theo thời gian (mới nhất trước)

Bước 2: Chọn đơn hàng cần xử lý

Bước 3: Cập nhật trạng thái:
   - PENDING → CONFIRMED: Xác nhận đơn
   - CONFIRMED → PREPARING: Bắt đầu làm
   - PREPARING → READY: Món đã xong
   - READY → COMPLETED: Khách đã nhận

Bước 4: Hệ thống tự động:
   - Cập nhật updated_at = thời gian hiện tại
   - Nếu COMPLETED → Lưu completed_at
   - Nếu COMPLETED và có bàn → Đổi bàn về "available"
   - Nếu COMPLETED → Cập nhật payment_status = "paid"
```

**Business Rules:**
- ✅ Chỉ Staff/Admin mới cập nhật được trạng thái
- ✅ Khách hàng chỉ xem được đơn hàng của mình
- ✅ Admin xem được tất cả đơn hàng
- ✅ Khi đơn hoàn thành, bàn được giải phóng
- ✅ Lưu lại thời gian hoàn thành (completed_at)

---

### 5️⃣ **Quản Lý Bàn (Dine-in)**

#### Tạo Bàn (Admin)
```
Bước 1: Admin tạo bàn mới
   - Số bàn (unique): "T01", "T02", v.v.
   - Số chỗ ngồi: 2, 4, 6, 8, v.v.
   - Vị trí: "Tầng 1", "Tầng 2", "Ngoài trời"
   - Trạng thái mặc định: "available"

Bước 2: Lưu vào database
```

#### Quy Trình Sử Dụng Bàn
```
1. AVAILABLE (Bàn trống)
   ↓
   Khách đặt đơn hàng dine-in và chọn bàn
   ↓
2. OCCUPIED (Đang sử dụng)
   ↓
   Đơn hàng hoàn thành
   ↓
3. AVAILABLE (Bàn trống)

Hoặc:
   AVAILABLE → RESERVED (Đặt trước)
```

#### Xem Bàn Trống
```
Bước 1: Khách hàng chọn "Ăn tại chỗ"
Bước 2: Hệ thống hiển thị danh sách bàn:
   - Chỉ hiển thị bàn có status = "available"
   - Hiển thị số chỗ ngồi
   - Hiển thị vị trí
Bước 3: Khách chọn bàn phù hợp
Bước 4: Khi đặt hàng → Bàn chuyển sang "occupied"
```

**Business Rules:**
- ✅ Số bàn phải unique
- ✅ Chỉ hiển thị bàn "available" khi đặt hàng
- ✅ Một đơn hàng chỉ có một bàn (hoặc không có)
- ✅ Khi đơn hoàn thành, bàn tự động về "available"
- ✅ Admin có thể manually đổi trạng thái bàn

---

## 💰 Thanh Toán

### Trạng Thái Thanh Toán
```
1. UNPAID (Chưa thanh toán)
   - Mặc định khi tạo đơn
   - Khách chưa thanh toán

2. PAID (Đã thanh toán)
   - Khách đã thanh toán
   - Có thể thanh toán trước hoặc khi nhận món

3. REFUNDED (Đã hoàn tiền)
   - Đơn bị hủy và đã hoàn tiền
```

### Quy Trình Thanh Toán
```
Hiện tại: Thanh toán khi nhận món (COD)

Bước 1: Khách đặt hàng → payment_status = "unpaid"
Bước 2: Nhân viên chuẩn bị món
Bước 3: Khách nhận món và thanh toán
Bước 4: Staff cập nhật payment_status = "paid"
Bước 5: Cập nhật order status = "completed"

Tương lai có thể tích hợp:
- Thanh toán online (VNPay, MoMo, ZaloPay)
- Thanh toán bằng thẻ
- Ví điện tử
```

**Business Rules:**
- ✅ Đơn hàng mới mặc định là "unpaid"
- ✅ Chỉ Staff/Admin cập nhật payment_status
- ✅ Khi hoàn thành đơn, nên cập nhật "paid"
- ✅ Đơn hủy có thể hoàn tiền (nếu đã thanh toán trước)

---

## 📊 Báo Cáo & Thống Kê

### Báo Cáo Cho Admin
```
1. Doanh thu theo ngày/tuần/tháng
   - Tổng số đơn hàng
   - Tổng doanh thu
   - Doanh thu trung bình/đơn

2. Sản phẩm bán chạy
   - Top 10 món bán nhiều nhất
   - Số lượng đã bán
   - Doanh thu từng món

3. Thống kê khách hàng
   - Số lượng khách hàng mới
   - Khách hàng thường xuyên
   - Giá trị đơn hàng trung bình

4. Hiệu suất
   - Thời gian xử lý đơn trung bình
   - Tỷ lệ đơn hủy
   - Tỷ lệ đơn hoàn thành
```

### Báo Cáo Cho Staff
```
1. Đơn hàng trong ca
   - Số đơn đã xử lý
   - Đơn đang chờ
   - Đơn đang chuẩn bị

2. Trạng thái bàn
   - Số bàn đang sử dụng
   - Số bàn trống
   - Thời gian sử dụng trung bình
```

---

## 🔔 Thông Báo (Notification)

### Thông Báo Cho Khách Hàng
```
1. Đơn hàng được xác nhận
   - "Đơn hàng #123 đã được xác nhận"
   
2. Đơn hàng đang chuẩn bị
   - "Đơn hàng #123 đang được chuẩn bị"
   
3. Đơn hàng sẵn sàng
   - "Đơn hàng #123 đã sẵn sàng, vui lòng đến quầy lấy món"
   
4. Đơn hàng hoàn thành
   - "Cảm ơn bạn đã sử dụng dịch vụ!"
   
5. Đơn hàng bị hủy
   - "Đơn hàng #123 đã bị hủy. Lý do: ..."
```

### Thông Báo Cho Staff
```
1. Đơn hàng mới
   - "Có đơn hàng mới #123 cần xử lý"
   - Hiển thị chi tiết đơn
   
2. Đơn hàng chờ lâu
   - "Đơn hàng #123 đã chờ quá 10 phút"
```

---

## 🎯 Use Cases Chi Tiết

### Use Case 1: Sinh viên đặt cà phê mang đi
```
1. Sinh viên đăng nhập vào hệ thống
2. Vào danh mục "Coffee"
3. Chọn "Cappuccino - 45,000đ"
4. Chọn số lượng: 1
5. Click "Thêm vào giỏ"
6. Xem giỏ hàng: 1 món, tổng 45,000đ
7. Click "Đặt hàng"
8. Chọn "Mang đi"
9. Ghi chú: "Ít đường"
10. Xác nhận đặt hàng
11. Nhận thông báo: "Đơn hàng #001 đã được tạo"
12. Đợi thông báo "Đơn hàng sẵn sàng"
13. Đến quầy lấy món và thanh toán
```

### Use Case 2: Nhóm sinh viên ăn tại chỗ
```
1. Đại diện nhóm đăng nhập
2. Thêm nhiều món vào giỏ:
   - 2× Phở bò - 50,000đ
   - 3× Cơm gà - 45,000đ
   - 4× Trà đá - 10,000đ
3. Tổng giỏ hàng: 275,000đ
4. Click "Đặt hàng"
5. Chọn "Ăn tại chỗ"
6. Chọn bàn "T05" (6 chỗ, Tầng 1)
7. Ghi chú: "Không hành"
8. Xác nhận đặt hàng
9. Nhận số bàn và số đơn hàng
10. Ngồi chờ tại bàn T05
11. Nhận thông báo "Món đã sẵn sàng"
12. Nhân viên mang món ra bàn
13. Ăn xong, thanh toán tại quầy
14. Bàn T05 được giải phóng
```

### Use Case 3: Staff xử lý đơn hàng
```
1. Staff đăng nhập hệ thống
2. Vào "Quản lý đơn hàng"
3. Thấy đơn mới #001 - Status: PENDING
4. Xem chi tiết:
   - 1× Cappuccino
   - Ghi chú: "Ít đường"
   - Loại: Mang đi
5. Click "Xác nhận đơn"
   → Status: CONFIRMED
6. Bắt đầu pha cà phê
7. Click "Đang chuẩn bị"
   → Status: PREPARING
8. Pha xong, click "Sẵn sàng"
   → Status: READY
   → Gửi thông báo cho khách
9. Khách đến lấy và thanh toán
10. Click "Hoàn thành"
    → Status: COMPLETED
    → Payment: PAID
```

### Use Case 4: Admin quản lý sản phẩm
```
1. Admin đăng nhập
2. Vào "Quản lý sản phẩm"
3. Click "Thêm sản phẩm mới"
4. Chọn danh mục: "Coffee"
5. Nhập thông tin:
   - Tên: "Latte"
   - Giá: 48,000đ
   - Mô tả: "Espresso với sữa tươi"
   - Upload hình ảnh
   - Thời gian chuẩn bị: 5 phút
   - Calories: 150
6. Click "Lưu"
7. Sản phẩm hiển thị trên menu
8. Khách hàng có thể đặt món mới
```

---

## 🔒 Phân Quyền & Bảo Mật

### Phân Quyền Chi Tiết

| Chức năng | Student | Staff | Admin |
|-----------|---------|-------|-------|
| Xem sản phẩm | ✅ | ✅ | ✅ |
| Thêm vào giỏ | ✅ | ✅ | ✅ |
| Đặt hàng | ✅ | ✅ | ✅ |
| Xem đơn hàng của mình | ✅ | ✅ | ✅ |
| Xem tất cả đơn hàng | ❌ | ✅ | ✅ |
| Cập nhật trạng thái đơn | ❌ | ✅ | ✅ |
| Quản lý sản phẩm | ❌ | ❌ | ✅ |
| Quản lý danh mục | ❌ | ❌ | ✅ |
| Quản lý người dùng | ❌ | ❌ | ✅ |
| Quản lý bàn | ❌ | ❌ | ✅ |
| Xem báo cáo | ❌ | ⚠️ | ✅ |

⚠️ = Xem báo cáo giới hạn

### Bảo Mật
```
1. Authentication
   - JWT token với expiry time
   - Password hashing (bcrypt)
   - Secure token storage

2. Authorization
   - Role-based access control
   - Endpoint protection
   - Resource ownership check

3. Data Protection
   - Input validation (Pydantic)
   - SQL injection prevention (ORM)
   - XSS protection
   - CORS configuration

4. Privacy
   - User chỉ xem được đơn hàng của mình
   - Thông tin cá nhân được bảo vệ
   - Admin log cho các thao tác quan trọng
```

---

## 📱 Tính Năng Mở Rộng (Future)

### Phase 2
- [ ] Thanh toán online (VNPay, MoMo)
- [ ] Đặt hàng trước (pre-order)
- [ ] Chương trình khuyến mãi/giảm giá
- [ ] Điểm thưởng (loyalty points)
- [ ] Đánh giá & nhận xét sản phẩm

### Phase 3
- [ ] Giao hàng (delivery)
- [ ] Tracking đơn hàng real-time
- [ ] Chat với nhân viên
- [ ] Đặt bàn trước
- [ ] Menu combo

### Phase 4
- [ ] Mobile app (iOS/Android)
- [ ] Push notification
- [ ] QR code ordering
- [ ] AI recommendation
- [ ] Phân tích hành vi khách hàng

---

## 📞 Liên Hệ & Hỗ Trợ

**Email**: support@weborder.com  
**Hotline**: 1900-xxxx  
**Giờ làm việc**: 7:00 - 22:00 (Thứ 2 - Chủ nhật)

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-18  
**Author**: Development Team
