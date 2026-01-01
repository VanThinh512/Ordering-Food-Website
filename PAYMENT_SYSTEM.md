# Payment System Documentation

## Overview
The Food Ordering Website now supports two payment methods:
1. **Cash (COD)** - Payment upon delivery
2. **Online Banking** - Bank transfer via VietQR

## Features

### Payment Method Selection
When users click "Đặt hàng ngay" in CartPage, a payment modal appears with two options:
- **💵 Tiền mặt (Cash)**: Pay when receiving the order
- **🏦 Chuyển khoản ngân hàng (Online Banking)**: Pay via bank transfer

### Cash Payment Flow
1. User selects "Tiền mặt" and confirms
2. Order is created with `payment_status = "unpaid"` and `payment_method = "cash"`
3. Order remains unpaid until completion
4. When order status changes to `COMPLETED`, payment status automatically becomes `"paid"`

### Online Banking Payment Flow
1. User selects "Chuyển khoản ngân hàng"
2. System displays VietQR code with:
   - Bank: MB Bank (MBBank - 970422)
   - Account Number: 7053765633
   - Account Name: PHAM TAN
   - Amount: Order total
   - Content: FOODORDER {order_id}
3. User scans QR code with banking app
4. Banking app auto-fills transfer details
5. User completes transfer
6. Order created with `payment_status = "unpaid"` and `payment_method = "online"`
7. Admin verifies payment and marks as paid

### Payment Retry
For unpaid online orders:
- "💳 Thanh toán lại" button appears in OrdersPage
- Users can:
  - View QR code again to complete payment
  - Switch to cash payment method

## Database Schema

### New Fields in `orders` table:
```sql
payment_method NVARCHAR(20) NOT NULL DEFAULT 'cash'  -- 'cash' or 'online'
bank_transfer_code NVARCHAR(100) NULL                 -- Transfer reference code
bank_transfer_verified BIT NOT NULL DEFAULT 0         -- Manual verification flag
```

### Indexes:
- `idx_orders_payment_method` on `payment_method`
- `idx_orders_bank_transfer_code` on `bank_transfer_code`

## Backend API

### Order Creation
**POST** `/api/v1/orders/`
```json
{
  "table_id": 1,
  "reservation_id": 5,
  "payment_method": "cash",  // or "online"
  "notes": "Optional notes"
}
```

### Verify Payment
**POST** `/api/v1/orders/{order_id}/verify-payment`
```json
{
  "transfer_code": "REF123456789"
}
```
- Marks order as paid
- Updates `bank_transfer_verified = true`

### Mark as Paid (Admin Only)
**POST** `/api/v1/orders/{order_id}/mark-paid`
- Admin endpoint to manually mark order as paid

## Frontend Components

### PaymentModal.jsx
- Path: `frontend/web-order-fe/src/components/common/PaymentModal.jsx`
- Props:
  - `isOpen`: boolean
  - `onClose`: function
  - `orderAmount`: number
  - `orderId`: number
  - `onConfirmPayment`: function(paymentMethod)

### Integration in CartPage
```jsx
import PaymentModal from '../components/common/PaymentModal';

const [showPaymentModal, setShowPaymentModal] = useState(false);

const handleCheckout = () => {
  // Validation...
  setShowPaymentModal(true);
};

const handleConfirmPayment = async (paymentMethod) => {
  // Create order with payment_method
  // Navigate to orders page
};
```

### Integration in OrdersPage
```jsx
// Show payment retry button for unpaid online orders
{order.payment_status === 'unpaid' && 
 order.payment_method === 'online' && 
 order.status !== 'cancelled' && (
  <button onClick={() => handleRetryPayment(order)}>
    💳 Thanh toán lại
  </button>
)}
```

## VietQR Integration

### QR Code Generation
URL format:
```
https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.png
  ?amount={AMOUNT}
  &addInfo={DESCRIPTION}
  &accountName={ACCOUNT_NAME}
```

Example:
```
https://img.vietqr.io/image/970422-7053765633-compact2.png
  ?amount=150000
  &addInfo=FOODORDER%2042
  &accountName=PHAM%20TAN
```

### Bank Information
- Bank: MB Bank (MBBank)
- Bank ID: 970422
- Account Number: 7053765633
- Account Name: PHAM TAN

## Payment Status Logic

### Status Transitions

#### Cash Payment:
```
Order Created → payment_status: "unpaid"
         ↓
Order Completed → payment_status: "paid" (automatic)
```

#### Online Payment:
```
Order Created → payment_status: "unpaid"
         ↓
Transfer Completed → Admin verifies
         ↓
Admin confirms → payment_status: "paid"
```

### Auto-Payment on Completion
In `order_service.py`:
```python
if new_status == OrderStatus.COMPLETED:
    if order.payment_method == PaymentMethod.CASH:
        order.payment_status = PaymentStatus.PAID
```

## CSS Styling

### Payment Status Badges
```css
.payment-unpaid {
    color: #ff9a62 !important;  /* Orange */
}

.payment-paid {
    color: #10b981 !important;  /* Green */
}

.payment-refunded {
    color: #94a3b8 !important;  /* Gray */
}
```

### Payment Modal
- Dark theme with glass morphism
- Responsive design
- QR code displayed on white background for scanning
- Smooth animations

## Testing Checklist

### Cash Payment:
- [ ] Select cash payment method
- [ ] Order created with payment_method = "cash"
- [ ] Payment status shows "Chưa thanh toán"
- [ ] When order completed, status becomes "Đã thanh toán"

### Online Banking:
- [ ] Select online banking method
- [ ] QR code displays correctly
- [ ] Order details shown (amount, account, reference)
- [ ] Order created with payment_method = "online"
- [ ] Payment retry button appears for unpaid orders
- [ ] Admin can verify payment

### Payment Retry:
- [ ] Unpaid online orders show retry button
- [ ] Can switch from online to cash
- [ ] Can view QR code again
- [ ] Modal closes after action

## Future Enhancements

1. **Automatic Payment Verification**
   - Webhook integration with bank API
   - Real-time payment status updates

2. **Multiple Payment Methods**
   - Credit/Debit cards
   - E-wallets (MoMo, ZaloPay, VNPay)
   - PayPal

3. **Payment History**
   - Detailed transaction logs
   - Receipt generation
   - Export to PDF

4. **Refund System**
   - Automated refund processing
   - Partial refunds
   - Refund tracking

## Support

For issues or questions:
- Check order status in OrdersPage
- Contact admin for payment verification
- Reference order ID in all communications
