# Tài Liệu Hệ Thống Thanh Toán

## Tổng Quan
Website Đặt Món Ăn hiện hỗ trợ hai phương thức thanh toán:
1. **Tiền mặt (COD)** - Thanh toán khi nhận hàng
2. **Chuyển khoản ngân hàng** - Chuyển khoản qua VietQR

## Tính Năng

### Lựa Chọn Phương Thức Thanh Toán
Khi người dùng nhấn "Đặt hàng ngay" trong CartPage, một modal thanh toán xuất hiện với hai tùy chọn:
- **💵 Tiền mặt (Cash)**: Thanh toán khi nhận đơn hàng
- **🏦 Chuyển khoản ngân hàng (Online Banking)**: Thanh toán qua chuyển khoản

### Quy Trình Thanh Toán Tiền Mặt
1. Người dùng chọn "Tiền mặt" và xác nhận
2. Đơn hàng được tạo với `payment_status = "unpaid"` và `payment_method = "cash"`
3. Đơn hàng vẫn chưa thanh toán cho đến khi hoàn tất
4. Khi trạng thái đơn hàng chuyển sang `COMPLETED`, trạng thái thanh toán tự động trở thành `"paid"`

### Quy Trình Thanh Toán Chuyển Khoản
1. Người dùng chọn "Chuyển khoản ngân hàng"
2. Hệ thống hiển thị mã VietQR với:
   - Ngân hàng: MB Bank (MBBank - 970422)
   - Số tài khoản: 7053765633
   - Tên tài khoản: PHAM TAN
   - Số tiền: Tổng đơn hàng
   - Nội dung: FOODORDER {order_id}
3. Người dùng quét mã QR bằng ứng dụng ngân hàng
4. Ứng dụng ngân hàng tự động điền thông tin chuyển khoản
5. Người dùng hoàn tất chuyển khoản
6. Đơn hàng được tạo với `payment_status = "unpaid"` và `payment_method = "online"`
7. Admin xác minh thanh toán và đánh dấu đã thanh toán

### Thanh Toán Lại
Đối với đơn hàng chuyển khoản chưa thanh toán:
- Nút "💳 Thanh toán lại" xuất hiện trong OrdersPage
- Người dùng có thể:
  - Xem lại mã QR để hoàn tất thanh toán
  - Chuyển sang phương thức thanh toán tiền mặt

## Cấu Trúc Database

### Các trường mới trong bảng `orders`:
```sql
payment_method NVARCHAR(20) NOT NULL DEFAULT 'cash'  -- 'cash' hoặc 'online'
bank_transfer_code NVARCHAR(100) NULL                 -- Mã tham chiếu chuyển khoản
bank_transfer_verified BIT NOT NULL DEFAULT 0         -- Cờ xác minh thủ công
```

### Indexes:
- `idx_orders_payment_method` trên `payment_method`
- `idx_orders_bank_transfer_code` trên `bank_transfer_code`

## Backend API

### Tạo Đơn Hàng
**POST** `/api/v1/orders/`
```json
{
  "table_id": 1,
  "reservation_id": 5,
  "payment_method": "cash",  // hoặc "online"
  "notes": "Ghi chú tùy chọn"
}
```

### Xác Minh Thanh Toán
**POST** `/api/v1/orders/{order_id}/verify-payment`
```json
{
  "transfer_code": "REF123456789"
}
```
- Đánh dấu đơn hàng đã thanh toán
- Cập nhật `bank_transfer_verified = true`

### Đánh Dấu Đã Thanh Toán (Chỉ Admin)
**POST** `/api/v1/orders/{order_id}/mark-paid`
- Endpoint cho admin để đánh dấu thủ công đơn hàng đã thanh toán

## Frontend Components

### PaymentModal.jsx
- Đường dẫn: `frontend/web-order-fe/src/components/common/PaymentModal.jsx`
- Props:
  - `isOpen`: boolean
  - `onClose`: function
  - `orderAmount`: number
  - `orderId`: number
  - `onConfirmPayment`: function(paymentMethod)

### Tích Hợp trong CartPage
```jsx
import PaymentModal from '../components/common/PaymentModal';

const [showPaymentModal, setShowPaymentModal] = useState(false);

const handleCheckout = () => {
  // Validation...
  setShowPaymentModal(true);
};

const handleConfirmPayment = async (paymentMethod) => {
  // Tạo đơn hàng với payment_method
  // Chuyển đến trang orders
};
```

### Tích Hợp trong OrdersPage
```jsx
// Hiển thị nút thanh toán lại cho đơn hàng chuyển khoản chưa thanh toán
{order.payment_status === 'unpaid' && 
 order.payment_method === 'online' && 
 order.status !== 'cancelled' && (
  <button onClick={() => handleRetryPayment(order)}>
    💳 Thanh toán lại
  </button>
)}
```

## Tích Hợp VietQR

### Tạo Mã QR
Định dạng URL:
```
https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.png
  ?amount={AMOUNT}
  &addInfo={DESCRIPTION}
  &accountName={ACCOUNT_NAME}
```

Ví dụ:
```
https://img.vietqr.io/image/970422-7053765633-compact2.png
  ?amount=150000
  &addInfo=FOODORDER%2042
  &accountName=PHAM%20TAN
```

### Thông Tin Ngân Hàng
- Ngân hàng: MB Bank (MBBank)
- Mã ngân hàng: 970422
- Số tài khoản: 7053765633
- Tên tài khoản: PHAM TAN

## Logic Trạng Thái Thanh Toán

### Chuyển Đổi Trạng Thái

#### Thanh Toán Tiền Mặt:
```
Tạo Đơn Hàng → payment_status: "unpaid"
         ↓
Đơn Hàng Hoàn Tất → payment_status: "paid" (tự động)
```

#### Thanh Toán Chuyển Khoản:
```
Tạo Đơn Hàng → payment_status: "unpaid"
         ↓
Hoàn Tất Chuyển Khoản → Admin xác minh
         ↓
Admin xác nhận → payment_status: "paid"
```

### Tự Động Thanh Toán Khi Hoàn Tất
Trong `order_service.py`:
```python
if new_status == OrderStatus.COMPLETED:
    if order.payment_method == PaymentMethod.CASH:
        order.payment_status = PaymentStatus.PAID
```

## CSS Styling

### Nhãn Trạng Thái Thanh Toán
```css
.payment-unpaid {
    color: #ff9a62 !important;  /* Cam */
}

.payment-paid {
    color: #10b981 !important;  /* Xanh lá */
}

.payment-refunded {
    color: #94a3b8 !important;  /* Xám */
}
```

### Modal Thanh Toán
- Giao diện tối với hiệu ứng kính mờ (glass morphism)
- Thiết kế responsive
- Mã QR hiển thị trên nền trắng để dễ quét
- Hiệu ứng chuyển động mượt mà

## Danh Sách Kiểm Tra

### Thanh Toán Tiền Mặt:
- [ ] Chọn phương thức thanh toán tiền mặt
- [ ] Đơn hàng được tạo với payment_method = "cash"
- [ ] Trạng thái thanh toán hiển thị "Chưa thanh toán"
- [ ] Khi đơn hàng hoàn tất, trạng thái trở thành "Đã thanh toán"

### Chuyển Khoản Ngân Hàng:
- [ ] Chọn phương thức chuyển khoản
- [ ] Mã QR hiển thị chính xác
- [ ] Chi tiết đơn hàng được hiển thị (số tiền, tài khoản, mã tham chiếu)
- [ ] Đơn hàng được tạo với payment_method = "online"
- [ ] Nút thanh toán lại xuất hiện cho đơn hàng chưa thanh toán
- [ ] Admin có thể xác minh thanh toán

### Thanh Toán Lại:
- [ ] Đơn hàng chuyển khoản chưa thanh toán hiển thị nút thanh toán lại
- [ ] Có thể chuyển từ chuyển khoản sang tiền mặt
- [ ] Có thể xem lại mã QR
- [ ] Modal đóng sau khi thực hiện hành động

## Cải Tiến Trong Tương Lai

1. **Xác Minh Thanh Toán Tự Động**
   - Tích hợp webhook với API ngân hàng
   - Cập nhật trạng thái thanh toán theo thời gian thực

2. **Nhiều Phương Thức Thanh Toán**
   - Thẻ tín dụng/ghi nợ
   - Ví điện tử (MoMo, ZaloPay, VNPay)
   - PayPal

3. **Lịch Sử Thanh Toán**
   - Nhật ký giao dịch chi tiết
   - Tạo hóa đơn
   - Xuất sang PDF

4. **Hệ Thống Hoàn Tiền**
   - Xử lý hoàn tiền tự động
   - Hoàn tiền một phần
   - Theo dõi hoàn tiền

## Hỗ Trợ

Khi gặp vấn đề hoặc có câu hỏi:
- Kiểm tra trạng thái đơn hàng trong OrdersPage
- Liên hệ admin để xác minh thanh toán
- Cung cấp mã đơn hàng trong mọi liên lạc
