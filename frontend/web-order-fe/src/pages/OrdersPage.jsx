import { useEffect, useState } from 'react';
import { useOrderStore } from '../stores/orderStore';
import { formatPrice, formatDate } from '../utils/helpers';
import { ORDER_STATUS_LABELS } from '../types';

const OrdersPage = () => {
    const { orders, fetchMyOrders, cancelOrder } = useOrderStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        await fetchMyOrders();
        setLoading(false);
    };

    const handleCancelOrder = async (orderId) => {
        if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
            const result = await cancelOrder(orderId);
            if (result.success) {
                alert('Đã hủy đơn hàng');
            } else {
                alert(result.error || 'Không thể hủy đơn hàng');
            }
        }
    };

    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            preparing: 'status-preparing',
            ready: 'status-ready',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled',
        };
        return statusClasses[status] || '';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="empty-orders">
                <div className="container">
                    <div className="empty-orders-content">
                        <div className="empty-icon">📋</div>
                        <h2>Chưa có đơn hàng nào</h2>
                        <p>Hãy đặt món ăn yêu thích của bạn</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="container">
                <h1 className="page-title">Đơn hàng của tôi</h1>

                <div className="orders-list">
                    {orders.map((order) => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <div className="order-info">
                                    <h3>Đơn hàng #{order.id}</h3>
                                    <p className="order-date">{formatDate(order.created_at)}</p>
                                </div>
                                <span className={`order-status ${getStatusClass(order.status)}`}>
                                    {ORDER_STATUS_LABELS[order.status]}
                                </span>
                            </div>

                            <div className="order-details">
                                <div className="order-table">
                                    <strong>Bàn:</strong> {order.table.number} - {order.table.location}
                                </div>

                                <div className="order-items">
                                    <h4>Món đã đặt:</h4>
                                    {order.items.map((item) => (
                                        <div key={item.id} className="order-item">
                                            <span className="item-name">
                                                {item.product.name} x{item.quantity}
                                            </span>
                                            <span className="item-price">
                                                {formatPrice(item.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {order.notes && (
                                    <div className="order-notes">
                                        <strong>Ghi chú:</strong> {order.notes}
                                    </div>
                                )}

                                <div className="order-total">
                                    <strong>Tổng cộng:</strong>
                                    <span className="total-amount">{formatPrice(order.total)}</span>
                                </div>
                            </div>

                            {order.status === 'pending' && (
                                <div className="order-actions">
                                    <button
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="btn-cancel-order"
                                    >
                                        Hủy đơn hàng
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;