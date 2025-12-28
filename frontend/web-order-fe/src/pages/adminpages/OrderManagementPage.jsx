/* eslint-disable no-undef */
import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import orderService from '../../services/Order';
import { formatPrice } from '../../utils/helpers';

const OrderManagementPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const ORDER_STATUSES = {
        pending: { label: 'Chờ xác nhận', color: '#ffc107', icon: '⏳' },
        confirmed: { label: 'Đã xác nhận', color: '#17a2b8', icon: '✓' },
        preparing: { label: 'Đang chuẩn bị', color: '#fd7e14', icon: '👨‍🍳' },
        ready: { label: 'Sẵn sàng', color: '#28a745', icon: '✓✓' },
        completed: { label: 'Hoàn thành', color: '#6c757d', icon: '✓✓✓' },
        cancelled: { label: 'Đã hủy', color: '#dc3545', icon: '✕' }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang này!');
            navigate('/');
            return;
        }

        loadOrders();

        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, user]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading orders...');

            const data = await orderService.getAll();

            console.log('📦 Raw API Response:', data);
            console.log('📦 Total orders:', data.length);

            if (data.length > 0) {
                console.log('📦 First order structure:', data[0]);
                console.log('📦 Available keys:', Object.keys(data[0]));
            }

            const sortedOrders = data.sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            );

            setOrders(sortedOrders);
            console.log('✅ Loaded orders:', sortedOrders.length);
        } catch (error) {
            console.error('❌ Error loading orders:', error);

            if (error.message?.includes('đăng nhập')) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate('/login');
                return;
            }

            alert('Không thể tải danh sách đơn hàng. ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const getTableInfo = (order) => {
        console.log('🪑 Getting table for order:', order.id, {
            table_number: order.table_number,
            table_id: order.table_id,
            table: order.table
        });

        return order.table_number ||
            order.table?.number ||
            order.table?.table_number ||
            (order.table_id ? `#${order.table_id}` : null) ||
            'N/A';
    };

    const getCustomerName = (order) => {
        return order.customer_name ||
            order.user_name ||
            order.user?.full_name ||
            order.user?.username ||
            order.user?.name ||
            'Sinh viên';
    };

    const getCustomerPhone = (order) => {
        return order.customer_phone ||
            order.phone ||
            order.user?.phone ||
            '';
    };

    const getOrderItems = (order) => {
        const items = Array.isArray(order.order_items)
            ? order.order_items
            : Array.isArray(order.items)
                ? order.items
                : [];
        console.log(`📝 Order #${order.id} items:`, items);
        return items;
    };

    const resolveReservation = (order) =>
        order.reservation ||
        order.table_reservation ||
        order.reservation_info ||
        order.reservationDetails;

    const getReservationStartTime = (order) => {
        const reservation = resolveReservation(order);
        return (
            reservation?.start_time ||
            reservation?.startTime ||
            reservation?.start ||
            null
        );
    };

    const getReservationEndTime = (order) => {
        const reservation = resolveReservation(order);
        return (
            reservation?.end_time ||
            reservation?.endTime ||
            reservation?.end ||
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

        return {
            timeLabel,
            dateLabel
        };
    };

    const calculateTotal = (order) => {
        if (order.total_amount) {
            console.log(`💰 Order #${order.id} total from total_amount:`, order.total_amount);
            return order.total_amount;
        }

        if (order.total_price) {
            console.log(`💰 Order #${order.id} total from total_price:`, order.total_price);
            return order.total_price;
        }

        if (order.total) {
            console.log(`💰 Order #${order.id} total from total:`, order.total);
            return order.total;
        }

        const items = getOrderItems(order);
        if (!items || items.length === 0) {
            console.log(`💰 Order #${order.id} has no items, total: 0`);
            return 0;
        }

        const total = items.reduce((sum, item) => {
            const quantity = item.quantity || 1;
            const unitPrice =
                item.price_at_time ??
                item.unit_price ??
                item.price ??
                item.product_price ??
                item.product?.price ??
                (item.subtotal && item.quantity ? item.subtotal / item.quantity : 0) ??
                0;
            const lineTotal = item.subtotal ?? unitPrice * quantity;
            console.log(`  - Item: ${item.product_name || item.name}, price: ${unitPrice}, qty: ${quantity}`);
            return sum + lineTotal;
        }, 0);

        console.log(`💰 Order #${order.id} calculated total:`, total);
        return total;
    };

    const filteredOrders = orders.filter(order => {
        if (selectedStatus !== 'all' && order.status !== selectedStatus) {
            return false;
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            return (
                order.id.toString().includes(term) ||
                getTableInfo(order).toString().toLowerCase().includes(term) ||
                getCustomerName(order).toLowerCase().includes(term) ||
                getCustomerPhone(order).toLowerCase().includes(term)
            );
        }

        return true;
    });

    const getStatusCount = (status) => {
        if (status === 'all') return orders.length;
        return orders.filter(o => o.status === status).length;
    };

    const handleStatusChange = async (orderId, newStatus) => {
        if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái đơn hàng #${orderId} sang "${ORDER_STATUSES[newStatus].label}"?`)) {
            return;
        }

        try {
            setUpdating(true);
            await orderService.updateStatus(orderId, newStatus);
            alert('Cập nhật trạng thái thành công!');
            await loadOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            alert(error.response?.data?.detail || 'Không thể cập nhật trạng thái');
        } finally {
            setUpdating(false);
        }
    };

    const handleViewDetails = (order) => {
        console.log('👁️ Viewing order details:', order);
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="order-management-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <span className="title-icon">📋</span>
                            Quản lý đơn hàng
                        </h1>
                        <p className="page-subtitle">
                            Theo dõi và quản lý tất cả đơn hàng trong hệ thống
                        </p>
                    </div>
                    <button className="btn-refresh" onClick={loadOrders} disabled={loading}>
                        <span className="btn-icon">🔄</span>
                        Làm mới
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <span className="stat-label">Tổng đơn hàng</span>
                            <strong className="stat-value">{orders.length}</strong>
                        </div>
                    </div>
                    <div className="stat-card stat-pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <span className="stat-label">Chờ xác nhận</span>
                            <strong className="stat-value">{getStatusCount('pending')}</strong>
                        </div>
                    </div>
                    <div className="stat-card stat-preparing">
                        <div className="stat-icon">👨‍🍳</div>
                        <div className="stat-content">
                            <span className="stat-label">Đang chuẩn bị</span>
                            <strong className="stat-value">{getStatusCount('preparing')}</strong>
                        </div>
                    </div>
                    <div className="stat-card stat-completed">
                        <div className="stat-icon">✓✓✓</div>
                        <div className="stat-content">
                            <span className="stat-label">Hoàn thành</span>
                            <strong className="stat-value">{getStatusCount('completed')}</strong>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, số bàn, tên khách..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search-btn"
                                onClick={() => setSearchTerm('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="status-filter">
                        <button
                            className={`status-filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedStatus('all')}
                        >
                            Tất cả ({getStatusCount('all')})
                        </button>
                        {Object.entries(ORDER_STATUSES).map(([status, info]) => (
                            <button
                                key={status}
                                className={`status-filter-btn ${selectedStatus === status ? 'active' : ''}`}
                                onClick={() => setSelectedStatus(status)}
                                style={{
                                    '--status-color': info.color,
                                    borderColor: selectedStatus === status ? info.color : 'transparent'
                                }}
                            >
                                {info.icon} {info.label} ({getStatusCount(status)})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Table */}
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h2>Không tìm thấy đơn hàng</h2>
                        <p>
                            {searchTerm
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : selectedStatus !== 'all'
                                    ? `Chưa có đơn hàng "${ORDER_STATUSES[selectedStatus].label}"`
                                    : 'Chưa có đơn hàng nào trong hệ thống'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Thời gian</th>
                                    <th>Bàn</th>
                                    <th>Khách hàng</th>
                                    <th>Số món</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => {
                                    const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                                    const items = getOrderItems(order);
                                    const total = calculateTotal(order);
                                    const orderDate = getOrderDateParts(order);

                                    const tableInfo = getTableInfo(order);
                                    const customerName = getCustomerName(order);
                                    const customerPhone = getCustomerPhone(order);

                                    return (
                                        <tr key={order.id}>
                                            <td>
                                                <strong className="order-id">#{order.id}</strong>
                                            </td>
                                            <td>
                                                <div className="order-time">
                                                    <span className="time-icon">🕐</span>
                                                    <div className="time-info">
                                                        <strong>{orderDate.timeLabel}</strong>
                                                        <span>{orderDate.dateLabel}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="table-badge">
                                                    <span className="table-icon">🪑</span>
                                                    Bàn {tableInfo}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="customer-info">
                                                    <strong>{customerName}</strong>
                                                    {customerPhone && (
                                                        <span className="phone">📞 {customerPhone}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="items-count">
                                                    {items.length} món
                                                </span>
                                            </td>
                                            <td>
                                                <strong className="order-total">
                                                    {formatPrice(total)}
                                                </strong>
                                            </td>
                                            <td>
                                                <div className="status-cell">
                                                    <select
                                                        className="status-select"
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        disabled={updating}
                                                        style={{
                                                            borderColor: statusInfo.color,
                                                            color: statusInfo.color
                                                        }}
                                                    >
                                                        {Object.entries(ORDER_STATUSES).map(([status, info]) => (
                                                            <option key={status} value={status}>
                                                                {info.icon} {info.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-action btn-view"
                                                        onClick={() => handleViewDetails(order)}
                                                        title="Xem chi tiết"
                                                    >
                                                        👁️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Detail Modal */}
                {showDetailModal && selectedOrder && (
                    <div className="modal-overlay" onClick={closeDetailModal}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    📋 Chi tiết đơn hàng #{selectedOrder.id}
                                </h2>
                                <button className="modal-close" onClick={closeDetailModal}>✕</button>
                            </div>

                            <div className="modal-body">
                                <div className="order-detail-grid">
                                    {/* Order Info */}
                                    <div className="detail-section">
                                        <h3 className="section-title">Thông tin đơn hàng</h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Mã đơn: </span>
                                                <strong>#{selectedOrder.id}</strong>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Thời gian: </span>
                                                    <strong>{getOrderDateParts(selectedOrder).timeLabel}</strong>
                                                    <span> | Ngày: {getOrderDateParts(selectedOrder).dateLabel}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Bàn: </span>
                                                <strong>Bàn {getTableInfo(selectedOrder)}</strong>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Trạng thái:</span>
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        background: ORDER_STATUSES[selectedOrder.status]?.color + '20' || '#ffc10720',
                                                        color: ORDER_STATUSES[selectedOrder.status]?.color || '#ffc107'
                                                    }}
                                                >
                                                    {ORDER_STATUSES[selectedOrder.status]?.icon || '⏳'} {ORDER_STATUSES[selectedOrder.status]?.label || 'Chờ xác nhận'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className="detail-section">
                                        <h3 className="section-title">Thông tin khách hàng</h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Tên: </span>
                                                <strong>{getCustomerName(selectedOrder)}</strong>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Số điện thoại: </span>
                                                <span>{getCustomerPhone(selectedOrder) || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="order-items-panel">
                                    <div className="items-header">
                                        <div className="items-title">
                                            <span className="items-title-icon">🍽️</span>
                                            Chi tiết món ăn
                                        </div>

                                        <span className="items-count-pill">
                                            {getOrderItems(selectedOrder).length} món
                                        </span>
                                    </div>

                                    {getOrderItems(selectedOrder).length === 0 ? (
                                        <p className="order-notes">Không có dữ liệu món ăn.</p>
                                    ) : (
                                        <div className="order-items-grid">
                                            {getOrderItems(selectedOrder).map((item, index) => {
                                                const itemName = item.product_name
                                                    || item.name
                                                    || item.product?.name
                                                    || item.product?.title
                                                    || 'Món ăn';
                                                const itemQuantity = item.quantity || 1;
                                                const unitPrice =
                                                    item.price_at_time ??
                                                    item.unit_price ??
                                                    item.price ??
                                                    item.product_price ??
                                                    item.product?.price ??
                                                    (item.subtotal && item.quantity ? item.subtotal / item.quantity : 0) ??
                                                    0;
                                                const lineTotal = item.subtotal ?? unitPrice * itemQuantity;

                                                return (
                                                    <div key={index} className="order-item-card">
                                                        <div className="item-main">
                                                            <div className="item-name">{itemName}</div>
                                                            <span className="item-quantity-pill">x{itemQuantity}</span>
                                                        </div>
                                                        <div className="item-prices">
                                                            <span className="unit-price">{formatPrice(unitPrice)}</span>
                                                            <span className="line-price"> - Tổng: </span>
                                                            <span className="line-price">
                                                                {formatPrice(lineTotal)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="order-summary-row">
                                        <span>Tổng cộng</span>
                                        <span className="summary-total-value">
                                            {formatPrice(calculateTotal(selectedOrder))}
                                        </span>
                                    </div>
                                </div>

                                {/* Notes */}
                                {(selectedOrder.notes || selectedOrder.note) && (
                                    <div className="detail-section">
                                        <h3 className="section-title">Ghi chú</h3>
                                        <p className="order-notes">{selectedOrder.notes || selectedOrder.note}</p>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={closeDetailModal}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderManagementPage;