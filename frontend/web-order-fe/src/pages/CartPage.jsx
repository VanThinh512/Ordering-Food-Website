import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useOrderStore } from '../stores/orderStore';
import tableService from '../services/Table';
import { formatPrice } from '../utils/helpers';

const CartPage = () => {
    const navigate = useNavigate();
    const { cart, fetchCart, updateQuantity, removeItem, clearCart } = useCartStore();
    const { createOrder } = useOrderStore();
    const [loading, setLoading] = useState(true);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadCart();
        loadTables();
    }, []);

    const loadCart = async () => {
        setLoading(true);
        await fetchCart();
        setLoading(false);
    };

    const loadTables = async () => {
        try {
            const data = await tableService.getAvailable();
            setTables(data);
        } catch (error) {
            console.error('Error loading tables:', error);
        }
    };

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        await updateQuantity(itemId, newQuantity);
    };

    const handleRemoveItem = async (itemId) => {
        if (confirm('Bạn có chắc muốn xóa món này?')) {
            await removeItem(itemId);
        }
    };

    const handleClearCart = async () => {
        if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
            await clearCart();
        }
    };

    const handleCheckout = async () => {
        if (!selectedTable) {
            alert('Vui lòng chọn bàn');
            return;
        }

        if (!cart?.items || cart.items.length === 0) {
            alert('Giỏ hàng trống');
            return;
        }

        setSubmitting(true);

        const orderData = {
            table_id: parseInt(selectedTable),
            notes: notes.trim() || undefined,
        };

        const result = await createOrder(orderData);

        setSubmitting(false);

        if (result.success) {
            alert('Đặt hàng thành công!');
            navigate('/orders');
        } else {
            alert(result.error || 'Đặt hàng thất bại. Vui lòng thử lại.');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (!cart?.items || cart.items.length === 0) {
        return (
            <div className="empty-cart">
                <div className="container">
                    <div className="empty-cart-content">
                        <div className="empty-icon">🛒</div>
                        <h2>Giỏ hàng trống</h2>
                        <p>Hãy thêm món ăn vào giỏ hàng của bạn</p>
                        <button onClick={() => navigate('/menu')} className="btn-primary">
                            Xem thực đơn
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <div className="cart-header">
                    <h1>Giỏ hàng của bạn</h1>
                    <button onClick={handleClearCart} className="btn-clear">
                        Xóa tất cả
                    </button>
                </div>

                <div className="cart-content">
                    <div className="cart-items">
                        {cart.items.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div className="item-image">
                                    {item.product.image_url ? (
                                        <img src={item.product.image_url} alt={item.product.name} />
                                    ) : (
                                        <div className="no-image">🍽️</div>
                                    )}
                                </div>
                                <div className="item-info">
                                    <h3>{item.product.name}</h3>
                                    <p className="item-price">{formatPrice(item.product.price)}</p>
                                </div>
                                <div className="item-quantity">
                                    <button
                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                        className="qty-btn"
                                    >
                                        -
                                    </button>
                                    <span className="qty-value">{item.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                        className="qty-btn"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="item-subtotal">
                                    {formatPrice(item.subtotal)}
                                </div>
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="btn-remove"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <h2>Tóm tắt đơn hàng</h2>

                        <div className="form-group">
                            <label htmlFor="table">Chọn bàn *</label>
                            <select
                                id="table"
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="form-select"
                            >
                                <option value="">-- Chọn bàn --</option>
                                {tables.map((table) => (
                                    <option key={table.id} value={table.id}>
                                        {table.number} - {table.location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Ghi chú</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Thêm ghi chú cho đơn hàng..."
                                rows="3"
                                className="form-textarea"
                            />
                        </div>

                        <div className="summary-row">
                            <span>Tổng cộng:</span>
                            <strong className="total-price">{formatPrice(cart.total)}</strong>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="btn-checkout"
                            disabled={submitting || !selectedTable}
                        >
                            {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;