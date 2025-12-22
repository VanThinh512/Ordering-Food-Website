export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    ready: 'Sẵn sàng',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
};

export const USER_ROLE = {
    ADMIN: 'admin',
    STAFF: 'staff',
    CUSTOMER: 'customer',
};

export const USER_ROLE_LABELS = {
    admin: 'Quản trị viên',
    staff: 'Nhân viên',
    customer: 'Khách hàng',
};

export const PAYMENT_METHOD = {
    CASH: 'cash',
    CARD: 'card',
    MOMO: 'momo',
    BANK_TRANSFER: 'bank_transfer',
};

export const PAYMENT_METHOD_LABELS = {
    cash: 'Tiền mặt',
    card: 'Thẻ',
    momo: 'MoMo',
    bank_transfer: 'Chuyển khoản',
};

export const ITEMS_PER_PAGE = 10;

export const PRODUCT_STATUS = {
    AVAILABLE: 'available',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued',
};