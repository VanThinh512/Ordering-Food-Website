export * from '../utils/constants';

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

export const PAYMENT_METHOD = {
    CASH: 'cash',
    CARD: 'card',
    MOMO: 'momo',
};