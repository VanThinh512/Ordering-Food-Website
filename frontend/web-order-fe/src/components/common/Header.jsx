import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

const Header = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { cart } = useCartStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    // Xử lý hiển thị tên
    const displayName = user?.full_name || user?.username || 'User';

    // Debug
    console.log('Header - User:', user);
    console.log('Header - Display Name:', displayName);

    return (
        <header className="header">
            <div className="container">
                <Link to="/" className="logo">
                    <h1>🍔 School Food Order</h1>
                </Link>

                <nav className="nav">
                    <Link to="/menu" className="nav-link">Menu</Link>

                    {isAuthenticated ? (
                        <>
                            <Link to="/cart" className="nav-link cart-link">
                                🛒 Giỏ hàng
                                {cartItemCount > 0 && (
                                    <span className="cart-badge">{cartItemCount}</span>
                                )}
                            </Link>
                            <Link to="/orders" className="nav-link">Đơn hàng</Link>
                            <Link to="/profile" className="nav-link">
                                👤 {displayName}
                            </Link>
                            <button onClick={handleLogout} className="btn-logout">
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-primary">Đăng nhập</Link>
                            <Link to="/register" className="btn-secondary">Đăng ký</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;