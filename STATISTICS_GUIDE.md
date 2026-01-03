# Hướng Dẫn Sử Dụng Chức Năng Thống Kê

## Tổng Quan

Đã thêm chức năng thống kê chi tiết với biểu đồ trực quan để theo dõi hiệu quả kinh doanh của nhà hàng.

## Các Tính Năng Thống Kê

### 1. 📊 Thống Kê Doanh Thu
- **Biểu đồ đường (Line Chart)**: Hiển thị doanh thu theo thời gian
- **Bộ lọc**:
  - Chọn năm (mặc định là năm hiện tại)
  - Chọn tháng hoặc "Cả năm"
- **Hiển thị**:
  - Nếu chọn "Cả năm": Doanh thu theo từng tháng trong năm
  - Nếu chọn tháng cụ thể: Doanh thu theo từng ngày trong tháng
- **Lưu ý quan trọng**: Chỉ tính doanh thu từ các đơn hàng có trạng thái **"Hoàn thành"** (completed)

### 2. 🧾 Thống Kê Đơn Hàng
- **Biểu đồ tròn (Pie Chart)**: Phân bố đơn hàng theo trạng thái
- **Các trạng thái**:
  - Chờ xác nhận (pending)
  - Đã xác nhận (confirmed)
  - Đang chuẩn bị (preparing)
  - Sẵn sàng (ready)
  - Hoàn thành (completed)
  - Đã hủy (cancelled)
- **Bộ lọc**: Chọn năm và tháng

### 3. 🪑 Thống Kê Đặt Bàn
- **Biểu đồ cột (Bar Chart)**: Số lượng đặt bàn theo thời gian
- **Biểu đồ tròn**: Phân bố đặt bàn theo trạng thái
- **Các trạng thái**:
  - Chờ xác nhận (pending)
  - Đã xác nhận (confirmed)
  - Đang diễn ra (active)
  - Hoàn thành (completed)
  - Đã hủy (cancelled)
- **Bộ lọc**: Chọn năm và tháng
- **Hiển thị**:
  - Nếu chọn "Cả năm": Số đặt bàn theo từng tháng
  - Nếu chọn tháng cụ thể: Số đặt bàn theo từng ngày

### 4. 📈 Tổng Quan (Overview Cards)
- Tổng số đơn hàng
- Doanh thu tổng (chỉ từ đơn hoàn thành)
- Tổng số lượt đặt bàn
- Tỷ lệ hoàn thành đơn hàng

## Cách Truy Cập

### Cho Admin
1. Đăng nhập với tài khoản admin
2. Vào trang **Profile** hoặc **Dashboard**
3. Click vào **"Thống kê & Báo cáo"** (📈)
4. Hoặc truy cập trực tiếp: `http://localhost:5173/admin/statistics`

### Các Route
- Dashboard: `/admin/dashboard` - Tổng quan nhanh
- Statistics: `/admin/statistics` - Thống kê chi tiết với biểu đồ

## API Endpoints

### Backend Endpoints Mới
```
GET /api/v1/statistics/overview
- Lấy thống kê tổng quan

GET /api/v1/statistics/revenue?year=2024&month=1
- Lấy dữ liệu doanh thu
- Params: year (bắt buộc), month (tùy chọn)

GET /api/v1/statistics/revenue-by-month?year=2024
- Lấy doanh thu theo tháng cho cả năm

GET /api/v1/statistics/orders?year=2024&month=1
- Lấy thống kê đơn hàng theo trạng thái

GET /api/v1/statistics/reservations?year=2024&month=1
- Lấy thống kê đặt bàn
```

### Quyền truy cập
- Chỉ **Admin** và **Staff** mới có thể truy cập các endpoint thống kê
- Sử dụng Bearer Token để xác thực

## Cấu Trúc Files Mới

### Backend
```
backend/app/api/v1/endpoints/statistics.py
- Các API endpoints cho thống kê
```

### Frontend
```
frontend/web-order-fe/src/pages/adminpages/StatisticsPage.jsx
- Trang hiển thị thống kê với biểu đồ

frontend/web-order-fe/src/services/Statistics.js
- Service gọi API thống kê
```

### Dependencies Mới
```json
"recharts": "^2.12.7"
```

## Hướng Dẫn Cài Đặt

### 1. Cài đặt dependencies
```bash
cd frontend/web-order-fe
npm install
```

### 2. Khởi động Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Khởi động Frontend
```bash
cd frontend/web-order-fe
npm run dev
```

## Kiểm Tra API

1. Truy cập Swagger Documentation: `http://localhost:8000/docs`
2. Tìm mục **"statistics"** trong danh sách endpoints
3. Test các endpoints với token admin

## Lưu Ý Quan Trọng

### Về Doanh Thu
- **CHỈ** đơn hàng có `status = "completed"` mới được tính vào doanh thu
- Đơn hàng pending, cancelled, preparing không tính vào doanh thu
- Sử dụng trường `completed_at` để tính thời gian hoàn thành

### Về Dữ Liệu
- Biểu đồ sẽ hiển thị rỗng nếu không có dữ liệu trong khoảng thời gian đã chọn
- Cần có dữ liệu mẫu (orders với status completed) để test biểu đồ
- Đảm bảo các đơn hàng có trường `completed_at` được cập nhật khi hoàn thành

### Về UI
- Responsive trên mobile
- Dark theme với màu sắc dễ nhìn
- Tooltip hiển thị chi tiết khi hover vào biểu đồ
- Legend để phân biệt các loại dữ liệu

## Tùy Chỉnh

### Thay đổi màu biểu đồ
Chỉnh sửa trong `StatisticsPage.jsx`:
```javascript
const COLORS = ['#ff9a62', '#62d1ff', '#62ff9a', '#ffd062', '#ff6262', '#9a62ff'];
```

### Thêm năm vào bộ lọc
Mặc định hiển thị 5 năm gần nhất. Để thay đổi:
```javascript
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
// Thay 5 thành số năm muốn hiển thị
```

## Troubleshooting

### Biểu đồ không hiển thị dữ liệu
1. Kiểm tra console browser có lỗi API không
2. Verify token admin đang hoạt động
3. Kiểm tra database có đơn hàng `completed` không
4. Xem API response trong Network tab

### Lỗi import recharts
```bash
cd frontend/web-order-fe
rm -rf node_modules package-lock.json
npm install
```

### Backend báo lỗi 403 Forbidden
- Đảm bảo đăng nhập với tài khoản admin
- Token phải còn hạn
- Refresh token nếu cần

## Demo Data

Để test chức năng, tạo một số đơn hàng mẫu với status "completed":
```sql
-- Cập nhật một số đơn thành completed để test
UPDATE orders 
SET status = 'completed', 
    completed_at = GETDATE() 
WHERE id IN (1, 2, 3);
```

## Screenshots

Xem ảnh mô tả trong thư mục `/docs/screenshots/` (nếu có)

## Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs của backend
2. Kiểm tra console của browser
3. Xem lại tài liệu API tại `/docs`

---

**Phiên bản**: 1.0.0  
**Ngày cập nhật**: 03/01/2026  
**Tác giả**: GitHub Copilot
