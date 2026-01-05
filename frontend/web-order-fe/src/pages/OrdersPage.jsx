import { useEffect, useMemo, useState } from 'react';
import { useOrderStore } from '../stores/orderStore';
import { formatPrice, formatDate } from '../utils/helpers';
import { ORDER_STATUS_LABELS } from '../types';
import PaymentModal from '../components/common/PaymentModal';

const OrdersPage = () => {
    const { orders, fetchMyOrders, cancelOrder } = useOrderStore();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        await fetchMyOrders();
        setLoading(false);
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

    const calculateOrderTotal = (order) => {
        if (!order) return 0;

        const totalCandidates = [
            order.total,
            order.total_amount,
            order.totalAmount,
            order.total_price,
            order.totalPrice,
        ];

        for (const candidate of totalCandidates) {
            if (typeof candidate === 'number' && !Number.isNaN(candidate)) {
                return candidate;
            }
        }

        if (!Array.isArray(order.items)) return 0;

        return order.items.reduce((sum, item) => {
            const quantity = item.quantity ?? 1;
            const unitPrice =
                item.price_at_time ??
                item.priceAtTime ??
                item.unit_price ??
                item.price ??
                item.product_price ??
                item.product?.price ??
                0;
            const lineTotal =
                (typeof item.subtotal === 'number' && !Number.isNaN(item.subtotal))
                    ? item.subtotal
                    : unitPrice * quantity;

            return sum + lineTotal;
        }, 0);
    };

    const resolveReservation = (order) =>
        order?.reservation ||
        order?.table_reservation ||
        order?.reservation_info ||
        order?.reservationDetails;

    const getReservationStartTime = (order) => {
        const reservation = resolveReservation(order);
        return (
            reservation?.start_time ||
            reservation?.startTime ||
            reservation?.start ||
            order?.reservation_start_time ||
            null
        );
    };

    const getReservationEndTime = (order) => {
        const reservation = resolveReservation(order);
        return (
            reservation?.end_time ||
            reservation?.endTime ||
            reservation?.end ||
            order?.reservation_end_time ||
            null
        );
    };

    const getOrderDateParts = (order) => {
        if (!order) {
            return { timeLabel: 'N/A', dateLabel: 'N/A' };
        }

        const startSource = getReservationStartTime(order);
        const endSource = getReservationEndTime(order);
        const fallbackSource = order.created_at;

        const startDate = startSource ? new Date(startSource) : null;
        const endDate = endSource ? new Date(endSource) : null;
        const fallbackDate = fallbackSource ? new Date(fallbackSource) : null;

        const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
        const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Ho_Chi_Minh'
        });

        const startLabel = startDate ? timeFormatter.format(startDate) : null;
        const endLabel = endDate ? timeFormatter.format(endDate) : null;
        const fallbackTime = fallbackDate ? timeFormatter.format(fallbackDate) : 'N/A';
        const fallbackDateLabel = fallbackDate ? dateFormatter.format(fallbackDate) : 'N/A';

        const primaryStartDateLabel = startDate ? dateFormatter.format(startDate) : null;
        const primaryEndDateLabel = endDate ? dateFormatter.format(endDate) : null;

        const dateLabel =
            primaryStartDateLabel
                ? primaryEndDateLabel && primaryEndDateLabel !== primaryStartDateLabel
                    ? `${primaryStartDateLabel} → ${primaryEndDateLabel}`
                    : primaryStartDateLabel
                : fallbackDateLabel;

        const hasReservationWindow = Boolean(startLabel || endLabel);
        const timeLabel = hasReservationWindow
            ? endLabel
                ? `${startLabel || fallbackTime} - ${endLabel}`
                : startLabel
            : fallbackTime;

        return { timeLabel, dateLabel };
    };

    const getTableLabel = (order) => {
        return order.table?.table_number
            || order.table?.number
            || order.table_number
            || order.table?.name
            || order.table?.id
            || '—';
    };

    const getCustomerName = (order) => {
        return order.user?.full_name
            || order.customer_name
            || order.user?.username
            || 'Khách hàng';
    };

    const statusSummary = useMemo(() => {
        const base = {
            total: orders?.length || 0,
            pending: 0,
            confirmed: 0,
            preparing: 0,
            ready: 0,
            delivered: 0,
            cancelled: 0
        };
        (orders || []).forEach((order) => {
            if (order.status && base[order.status] !== undefined) {
                base[order.status] += 1;
            }
        });
        return base;
    }, [orders]);

    const statusFilters = [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ xác nhận' },
        { key: 'confirmed', label: 'Đã xác nhận' },
        { key: 'preparing', label: 'Đang chuẩn bị' },
        { key: 'ready', label: 'Sẵn sàng' },
        { key: 'delivered', label: 'Hoàn thành' },
        { key: 'cancelled', label: 'Đã hủy' }
    ];

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        return orders.filter((order) => {
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            if (!matchesStatus) return false;

            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const tokens = [
                `#${order.id}`,
                `Bàn ${getTableLabel(order)}`,
                order.table?.location,
                getCustomerName(order),
                ORDER_STATUS_LABELS[order.status]
            ];
            return tokens
                .filter(Boolean)
                .some((value) => value.toString().toLowerCase().includes(query));
        });
    }, [orders, searchQuery, statusFilter]);

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

    const handleRetryPayment = (order) => {
        setSelectedOrder(order);
        setShowPaymentModal(true);
    };

    const handleConfirmRetryPayment = async (paymentMethod) => {
        if (!selectedOrder) return;

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');

            // If user chooses cash, update payment method
            if (paymentMethod === 'cash') {
                const response = await fetch(`http://localhost:8000/api/v1/orders/${selectedOrder.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        payment_method: paymentMethod
                    })
                });

                if (response.ok) {
                    alert('Đã chuyển sang thanh toán tiền mặt');
                    setShowPaymentModal(false);
                    await loadOrders();
                }
            } else {
                // For online payment, just show QR and instruction
                setShowPaymentModal(false);
                alert('Vui lòng hoàn tất chuyển khoản theo QR code vừa hiển thị.\n\nTrạng thái thanh toán sẽ được cập nhật sau khi admin xác nhận.');
            }
        } catch (error) {
            console.error('Retry payment error:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        }
    };

    const getPaymentStatusLabel = (paymentStatus) => {
        const labels = {
            unpaid: 'Chưa thanh toán',
            paid: 'Đã thanh toán',
            refunded: 'Đã hoàn tiền'
        };
        return labels[paymentStatus] || paymentStatus;
    };

    const getPaymentStatusClass = (paymentStatus) => {
        const classes = {
            unpaid: 'payment-unpaid',
            paid: 'payment-paid',
            refunded: 'payment-refunded'
        };
        return classes[paymentStatus] || '';
    };

    // --- Đã xóa các dấu ngoặc thừa ở đây ---

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

    const summaryCards = [
        {
            label: 'Tổng đơn hàng',
            value: statusSummary.total,
            icon: '📊',
            accent: 'accent-purple'
        },
        {
            label: 'Chờ xác nhận',
            value: statusSummary.pending + statusSummary.confirmed,
            icon: '⏳',
            accent: 'accent-orange'
        },
        {
            label: 'Đang chuẩn bị',
            value: statusSummary.preparing,
            icon: '👨‍🍳',
            accent: 'accent-cyan'
        },
        {
            label: 'Hoàn thành',
            value: statusSummary.delivered,
            icon: '✅',
            accent: 'accent-green'
        }
    ];

    return (
        <div className="orders-page">
            <div className="orders-backdrop"></div>
            <div className="container orders-container">
                <section className="orders-hero">
                    <div>
                        <span className="orders-kicker">Trung tâm đơn hàng</span>
                        <h1>Quản lý đơn hàng</h1>
                        <p>Theo dõi trạng thái từng đơn hàng và xử lý nhanh chóng trong cùng một nơi.</p>
                    </div>
                    <button className="orders-refresh-btn" onClick={loadOrders}>
                        <span className="refresh-icon">↻</span> Làm mới
                    </button>
                </section>

                <section className="orders-summary-grid">
                    {summaryCards.map((card) => (
                        <div key={card.label} className={`orders-stat-card ${card.accent}`}>
                            <div className="stat-icon">{card.icon}</div>
                            <p className="stat-label">{card.label}</p>
                            <p className="stat-value">{card.value}</p>
                        </div>
                    ))}
                </section>

                <section className="orders-filter-bar">
                    <div className="orders-search">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, bàn, khách hàng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="orders-filters">
                        {statusFilters.map((filterOption) => (
                            <button
                                key={filterOption.key}
                                className={`orders-filter-btn ${statusFilter === filterOption.key ? 'active' : ''}`}
                                onClick={() => setStatusFilter(filterOption.key)}
                            >
                                {filterOption.label}
                                {filterOption.key !== 'all' && (
                                    <span className="filter-count-pill">{statusSummary[filterOption.key] || 0}</span>
                                )}
                                {filterOption.key === 'all' && (
                                    <span className="filter-count-pill">{statusSummary.total}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                <div className="orders-list">
                    {filteredOrders.length === 0 && (
                        <div className="orders-empty-state">
                            <p>Không có đơn hàng phù hợp với bộ lọc hiện tại.</p>
                        </div>
                    )}
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="order-card glass-panel">
                            <div className="order-header">
                                <div>
                                    <p className="order-code">Đơn hàng #{order.id}</p>
                                    <div className="order-time">
                                        <span className="time-icon">🕒</span>
                                        <div className="time-info">
                                            <strong>{getOrderDateParts(order).timeLabel}</strong>
                                            <span>{getOrderDateParts(order).dateLabel}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`order-status ${getStatusClass(order.status)}`}>
                                    {ORDER_STATUS_LABELS[order.status]}
                                </span>
                            </div>

                            <div className="order-meta">
                                <div className="meta-pill">
                                    <span className="meta-label">Bàn</span>
                                    <strong>Bàn {getTableLabel(order)}</strong>
                                    <span className="meta-desc"> {order.table?.location}</span>
                                </div>
                                <div className="meta-pill">
                                    <span className="meta-label">Khách hàng</span>
                                    <strong>{getCustomerName(order)}</strong>
                                </div>
                                <div className="meta-pill">
                                    <span className="meta-label">Số món</span>
                                    <strong>{order.items.length}</strong>
                                </div>
                                <div className="meta-pill">
                                    <span className="meta-label">Thanh toán</span>
                                    <strong className={getPaymentStatusClass(order.payment_status)}>
                                        {getPaymentStatusLabel(order.payment_status)}
                                    </strong>
                                </div>
                                <div className="meta-pill">
                                    <span className="meta-label">Tổng cộng</span>
                                    <strong>{formatPrice(calculateOrderTotal(order))}</strong>
                                </div>
                            </div>

                            <div className="order-items">
                                {order.items.map((item) => (
                                    <div key={item.id} className="order-item">
                                        <div>
                                            <p className="item-name">{item.product.name}</p>
                                            <span className="item-qty">x{item.quantity}</span>
                                        </div>
                                        <p className="item-price">{formatPrice(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>

                            {order.notes && (
                                <div className="order-notes">
                                    <p>{order.notes}</p>
                                </div>
                            )}

                            <div className="order-footer">
                                <div className="order-total">
                                    <span>Tổng cộng: </span>
                                    <strong>{formatPrice(calculateOrderTotal(order))}</strong>
                                </div>

                                <div className="order-actions">
                                    {order.status === 'pending' && (
                                        <button className="btn-cancel-order" onClick={() => handleCancelOrder(order.id)}>
                                            Hủy đơn hàng
                                        </button>
                                    )}

                                    {order.payment_status === 'unpaid' && order.payment_method === 'online' && order.status !== 'cancelled' && (
                                        <button className="btn-retry-payment" onClick={() => handleRetryPayment(order)}>
                                            💳 Thanh toán lại
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Modal for retry */}
            {selectedOrder && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedOrder(null);
                    }}
                    orderAmount={calculateOrderTotal(selectedOrder)}
                    orderId={selectedOrder.id}
                    onConfirmPayment={handleConfirmRetryPayment}
                />
            )}
        </div>
    );
};

export default OrdersPage;