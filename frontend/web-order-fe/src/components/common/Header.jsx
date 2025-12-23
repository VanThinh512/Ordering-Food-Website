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
    const isAdmin = user?.role === 'admin';

    // Debug
    console.log('Header - User:', user);
    console.log('Header - Display Name:', displayName);

    return (
        <header className="header">
            <div className="container">
                <Link to="/" className="logo">
                    <h1>🍔 School Food Order</h1>
                </Link>

                <nav className={`nav ${isAuthenticated ? 'nav-auth' : ''}`}>
                    <Link to="/menu" className="nav-link">Menu</Link>
                    <Link to="/tables" className="nav-link">Đặt bàn</Link> {/* Thêm */}

                    {isAuthenticated ? (
                        <>
                            <Link to="/cart" className="nav-link cart-link">
                                🛒 Giỏ hàng
                                {cartItemCount > 0 && (
                                    <span className="cart-badge">{cartItemCount}</span>
                                )}
                            </Link>
                            <Link to="/orders" className="nav-link">Đơn hàng</Link>
                            {isAdmin ? (
                                <>
                                    <Link to="/admin/dashboard" className="nav-link nav-admin-link">
                                        <span className="nav-user-name">👤 System Administrator</span>
                                    </Link>
                                </>
                            ) : (
                                <Link to="/profile" className="nav-link nav-user-link">
                                    <span className="nav-user-name">{displayName}</span>
                                </Link>
                            )}
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