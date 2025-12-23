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
    const { getSelectedTable, clearSelectedTable } = useTableStore();
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

    const handleCheckout = async () => {
        const table = getSelectedTable();
        console.log('🔍 Checking out with table:', table);

        if (!table) {
            alert('Vui lòng chọn bàn trước khi đặt hàng');
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

            // Chuẩn bị dữ liệu order
            const orderData = {
                table_id: table.id,
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

            // Clear selected table
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
                {/* Header */}
                <div className="cart-header">
                    <h1 className="page-title">🛒 Giỏ hàng của bạn</h1>
                    {currentTable ? (
                        <div className="table-info">
                            <span>🪑 Bàn {currentTable.number}</span>
                        </div>
                    ) : (
                        <div className="table-info" style={{ background: '#ffc107', color: '#000' }}>
                            <span>⚠️ Chưa chọn bàn</span>
                            <button
                                onClick={() => navigate('/tables')}
                                style={{ marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
                            >
                                Chọn bàn
                            </button>
                        </div>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h2>Giỏ hàng trống</h2>
                        <p>Hãy thêm món ăn vào giỏ hàng để tiếp tục</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/menu')}
                        >
                            Xem thực đơn
                        </button>
                    </div>
                ) : (
                    <div className="cart-content">
                        {/* Cart Items */}
                        <div className="cart-items">
                            <div className="cart-items-header">
                                <h2>Món đã chọn ({items.length})</h2>
                                <button
                                    className="btn-clear"
                                    onClick={handleClearCart}
                                >
                                    Xóa tất cả
                                </button>
                            </div>

                            <div className="items-list">
                                {items.map((item) => {
                                    const product = item.product;
                                    const price = item.price_at_time || product?.price || 0;

                                    return (
                                        <div key={item.id} className="cart-item">
                                            <div className="item-image">
                                                {product?.image_url ? (
                                                    <img src={product.image_url} alt={product.name} />
                                                ) : (
                                                    <div className="no-image">🍽️</div>
                                                )}
                                            </div>

                                            <div className="item-info">
                                                <h3 className="item-name">{product?.name || 'Món ăn'}</h3>
                                                <p className="item-price">{formatPrice(price)}</p>
                                            </div>

                                            <div className="item-quantity">
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    disabled={isLoading}
                                                >
                                                    −
                                                </button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    disabled={isLoading}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="item-total">
                                                {formatPrice(price * item.quantity)}
                                            </div>

                                            <button
                                                className="btn-remove"
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={isLoading}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cart Summary */}
                        <div className="cart-summary">
                            <h2>Tóm tắt đơn hàng</h2>

                            {currentTable ? (
                                <div className="summary-item">
                                    <span>Bàn số:</span>
                                    <strong>Bàn {currentTable.number}</strong>
                                </div>
                            ) : (
                                <div className="summary-item" style={{ color: '#ffc107' }}>
                                    <span>⚠️ Chưa chọn bàn</span>
                                    <button onClick={() => navigate('/tables')}>
                                        Chọn bàn
                                    </button>
                                </div>
                            )}

                            <div className="summary-item">
                                <span>Số lượng món:</span>
                                <strong>{items.length} món</strong>
                            </div>

                            <div className="summary-item">
                                <span>Tổng số lượng:</span>
                                <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-total">
                                <span>Tổng cộng:</span>
                                <strong>{formatPrice(getTotal())}</strong>
                            </div>

                            <div className="notes-section">
                                <label htmlFor="notes">Ghi chú:</label>
                                <textarea
                                    id="notes"
                                    rows="3"
                                    placeholder="Thêm ghi chú cho đơn hàng..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="notes-input"
                                />
                            </div>

                            <button
                                className="btn-checkout"
                                onClick={handleCheckout}
                                disabled={isSubmitting || items.length === 0 || !currentTable}
                            >
                                {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
                            </button>

                            <button
                                className="btn-continue"
                                onClick={() => navigate('/menu')}
                            >
                                Tiếp tục chọn món
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;