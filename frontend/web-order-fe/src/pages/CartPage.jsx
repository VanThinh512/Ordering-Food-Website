import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useTableStore } from '../stores/tableStore';
import { formatPrice } from '../utils/helpers';

const CartPage = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTable, setCurrentTable] = useState(null);

    const {
        items,
        fetchCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotal,
        isLoading
    } = useCartStore();

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const {
        getSelectedTable,
        clearSelectedTable,
        getSelectedReservation,
        selectedReservation,
        cancelReservation,
        clearReservation,
        ensureReservation
    } = useTableStore();
    const selectedTableFromStore = useTableStore((state) => state.selectedTable);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Load table selection
        const table = getSelectedTable();
        console.log('🪑 Selected table from store:', table);
        setCurrentTable(table);
        getSelectedReservation();

        // Load cart from server
        console.log('📦 Loading cart...');
        fetchCart();
    }, [isAuthenticated]);

    // Watch for changes in selectedTable from store
    useEffect(() => {
        console.log('🔄 Table store changed:', selectedTableFromStore);
        setCurrentTable(selectedTableFromStore || getSelectedTable());
    }, [selectedTableFromStore]);

    useEffect(() => {
        console.log('🛒 Cart items updated:', items);
        console.log('📊 Cart details:', {
            itemCount: items.length,
            tableId: currentTable?.id,
            tableName: currentTable?.number,
            items: items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product?.name,
                quantity: item.quantity,
                price: item.price_at_time || item.product?.price
            }))
        });
    }, [items, currentTable]);

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) {
            if (window.confirm('Bạn có muốn xóa món này khỏi giỏ hàng?')) {
                await removeFromCart(itemId);
            }
            return;
        }
        await updateQuantity(itemId, newQuantity);
    };

    const handleRemoveItem = async (itemId) => {
        if (window.confirm('Bạn có chắc muốn xóa món này?')) {
            await removeFromCart(itemId);
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
            await clearCart();
        }
    };

    const handleCancelTable = async () => {
        if (
            window.confirm(
                'Bạn có chắc muốn hủy bàn và xóa toàn bộ món đã chọn?'
            )
        ) {
            await clearCart();
            if (selectedReservation) {
                try {
                    await cancelReservation();
                } catch (error) {
                    console.error('Không thể hủy giữ bàn:', error);
                }
            } else {
                clearReservation();
            }
            clearSelectedTable();
            setCurrentTable(null);
        }
    };

    const handleCheckout = async () => {
        const table = getSelectedTable();
        console.log('🔍 Checking out with table:', table);

        if (!table) {
            alert('Vui lòng chọn bàn trước khi đặt hàng');
            navigate('/tables');
            return;
        }

        if (!selectedReservation || selectedReservation.table_id !== table.id) {
            alert('Vui lòng giữ bàn và chọn khung giờ trước khi đặt hàng.');
            navigate('/tables');
            return;
        }

        if (items.length === 0) {
            alert('Giỏ hàng trống');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');

            // Đảm bảo reservation đã được tạo (nếu mới chỉ giữ tạm)
            const confirmedReservation = await ensureReservation();

            // Chuẩn bị dữ liệu order
            const orderData = {
                table_id: table.id,
                reservation_id: confirmedReservation.id,
                items: items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price_at_time || item.product?.price
                }))
            };

            // Thêm notes nếu có
            if (notes && notes.trim()) {
                orderData.notes = notes.trim();
            }

            console.log('📝 Creating order with data:', orderData);

            const response = await fetch('http://localhost:8000/api/v1/orders/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const responseData = await response.json();
            console.log('📦 Server response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.detail || 'Đặt hàng thất bại');
            }

            console.log('✅ Order created successfully:', responseData);

            alert('Đặt hàng thành công! Bàn đã được đánh dấu đang sử dụng.');

            // Clear cart after successful order
            await clearCart();
            await cancelReservation().catch(() => clearReservation());
            clearSelectedTable();

            // Navigate to orders page
            navigate('/orders');
        } catch (error) {
            console.error('❌ Checkout error:', error);

            // Hiển thị lỗi chi tiết
            if (error.message.includes('400')) {
                alert('Dữ liệu đơn hàng không hợp lệ. Vui lòng kiểm tra lại giỏ hàng.');
            } else if (error.message.includes('403')) {
                alert('Bạn không có quyền thực hiện thao tác này.');
            } else if (error.message.includes('401')) {
                alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                navigate('/login');
            } else {
                alert(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    if (isLoading) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Đang tải giỏ hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container cart-container">
                <div className="cart-hero glass-panel">
                    <div className="cart-hero-copy">
                        <span className="dashboard-eyebrow">Giỏ hàng</span>
                        <h1>Giữ trọn bữa ăn hôm nay</h1>
                        <p>
                            Kiểm tra lại các món đã chọn, thêm ghi chú cho bếp và hoàn tất đơn đặt món chỉ với một lượt chạm.
                            Chúng tôi sẽ chuẩn bị mọi thứ trước khi bạn tới bàn.
                        </p>
                        <div className="hero-actions">
                            <button className="btn-secondary" onClick={() => navigate('/menu')}>
                                Tiếp tục chọn món
                            </button>
                        </div>
                    </div>
                    <div className="cart-hero-status">
                        <div className={`table-chip ${currentTable ? 'ready' : 'warning'}`}>
                            <div>
                                <p className="chip-label">Trạng thái bàn</p>
                                <strong>
                                    {currentTable
                                        ? `Bàn ${currentTable.table_number || currentTable.number}`
                                        : 'Chưa chọn bàn'}
                                </strong>
                                <span className="chip-subtext">
                                    {currentTable?.location || 'Vui lòng chọn bàn để đặt món'}
                                </span>
                            </div>
                            {!currentTable && (
                                <button className="chip-action" onClick={() => navigate('/tables')}>
                                    Chọn bàn
                                </button>
                            )}
                        </div>
                        {currentTable && (
                            <div className={`reservation-chip-card ${selectedReservation ? 'active' : 'warning'}`}>
                                <div>
                                    <p className="chip-label">Khung giờ giữ bàn</p>
                                    {selectedReservation ? (
                                        <strong>
                                            {new Date(selectedReservation.start_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {' - '}
                                            {new Date(selectedReservation.end_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </strong>
                                    ) : (
                                        <strong>Chưa giữ khung giờ</strong>
                                    )}
                                    <span className="chip-subtext">
                                        {selectedReservation ? 'Bàn sẽ tự hủy nếu quá giờ đã giữ' : 'Hãy chọn khung giờ tại trang Bàn'}
                                    </span>
                                </div>
                                {!selectedReservation ? (
                                    <button className="chip-action" onClick={() => navigate('/tables')}>
                                        Giữ bàn
                                    </button>
                                ) : (
                                    <button className="chip-action" onClick={handleCancelTable}>
                                        Hủy giữ & làm mới
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="cart-hero-metrics">
                            <div className="cart-metric">
                                <span>Món đã chọn</span>
                                <strong>{items.length}</strong>
                            </div>
                            <div className="cart-metric">
                                <span>Tổng số lượng</span>
                                <strong>{totalQuantity}</strong>
                            </div>
                            <div className="cart-metric">
                                <span>Tổng tiền tạm tính</span>
                                <strong>{formatPrice(getTotal())}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="empty-cart glass-panel">
                        <div className="empty-cart-icon">🛒</div>
                        <h2>Giỏ hàng của bạn đang trống</h2>
                        <p>Khám phá thực đơn để thêm món ăn yêu thích và quay lại hoàn tất đơn hàng.</p>
                        <button className="btn-primary" onClick={() => navigate('/menu')}>
                            Xem thực đơn
                        </button>
                    </div>
                ) : (
                    <div className="cart-grid">
                        <section className="cart-items glass-panel">
                            <div className="section-heading">
                                <div>
                                    <p className="section-eyebrow">Danh sách món</p>
                                    <h2>Món đã chọn ({items.length})</h2>
                                </div>
                                <button className="ghost-link" onClick={handleClearCart}>
                                    Xóa tất cả
                                </button>
                            </div>

                            <div className="cart-items-list">
                                {items.map((item) => {
                                    const product = item.product;
                                    const price = item.price_at_time || product?.price || 0;

                                    return (
                                        <div key={item.id} className="cart-item-card">
                                            <div className="cart-item-thumb">
                                                {product?.image_url ? (
                                                    <img src={product.image_url} alt={product.name} />
                                                ) : (
                                                    <div className="no-image">🍽️</div>
                                                )}
                                            </div>
                                            <div className="cart-item-body">
                                                <div className="cart-item-head">
                                                    <div>
                                                        <h3>{product?.name || 'Món ăn'}</h3>
                                                        <span className="item-unit-price">{formatPrice(price)} / suất</span>
                                                    </div>
                                                    <button
                                                        className="ghost-btn"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        disabled={isLoading}
                                                        aria-label="Xóa món khỏi giỏ"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                <div className="cart-item-meta">
                                                    <div className="qty-control" aria-label="Điều chỉnh số lượng">
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            disabled={isLoading}
                                                            aria-label="Giảm số lượng"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="qty-value">{item.quantity}</span>
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                            disabled={isLoading}
                                                            aria-label="Tăng số lượng"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="item-total">
                                                        <span>Tạm tính</span>
                                                        <strong>{formatPrice(price * item.quantity)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <aside className="cart-summary glass-panel">
                            <div className="summary-heading">
                                <p className="section-eyebrow">Tổng kết</p>
                                <h2>Tóm tắt đơn hàng</h2>
                            </div>

                            <div className="summary-list">
                                <div className="summary-item">
                                    <span>Bàn ăn</span>
                                    {currentTable ? (
                                        <strong>
                                            Bàn {currentTable.table_number || currentTable.number}
                                        </strong>
                                    ) : (
                                        <button className="chip-action" onClick={() => navigate('/tables')}>
                                            Chọn bàn
                                        </button>
                                    )}
                                </div>
                                <div className="summary-item">
                                    <span>Số lượng món</span>
                                    <strong>{items.length} món</strong>
                                </div>
                                <div className="summary-item">
                                    <span>Tổng suất</span>
                                    <strong>{totalQuantity}</strong>
                                </div>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-total">
                                <span>Tổng cộng</span>
                                <strong>{formatPrice(getTotal())}</strong>
                            </div>

                            <div className="notes-section">
                                <div className="notes-header">
                                    <div>
                                        <p className="notes-label">Ghi chú cho bếp</p>
                                        <span className="notes-helper">
                                            Thêm yêu cầu đặc biệt để bếp chuẩn bị chính xác.
                                        </span>
                                    </div>
                                    <span className="notes-char-count">{notes.length}/200</span>
                                </div>
                                <textarea
                                    id="notes"
                                    rows="3"
                                    maxLength={200}
                                    placeholder="Ví dụ: Ít cay, thêm chanh, giao món trước 11h30..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="notes-input"
                                />
                            </div>

                            <div className="cart-actions">
                                <button
                                    className="btn-checkout"
                                    onClick={handleCheckout}
                                    disabled={isSubmitting || items.length === 0 || !currentTable}
                                >
                                    {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                                </button>

                                <button className="btn-continue" onClick={() => navigate('/menu')}>
                                    Tiếp tục chọn món
                                </button>

                                <button
                                    className="btn-cancel-table"
                                    onClick={handleCancelTable}
                                    disabled={items.length === 0 && !currentTable}
                                >
                                    Hủy bàn & làm trống giỏ
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;