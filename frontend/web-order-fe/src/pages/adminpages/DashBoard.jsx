import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTableStore } from '../../stores/tableStore';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import userService from '../../services/User';
import productService from '../../services/Product';
import categoryService from '../../services/Category';
import orderService from '../../services/Order';

const DashBoard = () => {
    const { availableTables, fetchAvailableTables } = useTableStore();
    const { cart } = useCartStore();
    const { user } = useAuthStore();

    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadAllData = async () => {
            setLoadingData(true);
            setError(null);

            try {
                await fetchAvailableTables();
                const [usersRes, productsRes, categoriesRes, ordersRes] = await Promise.all([
                    userService.getAll({ limit: 20 }),
                    productService.getAll({ limit: 50 }),
                    categoryService.getAll(),
                    orderService.getAll({ limit: 50 })
                ]);

                if (!isMounted) return;

                setUsers(usersRes || []);
                setProducts(productsRes || []);
                setCategories(categoriesRes || []);
                setOrders(ordersRes || []);
            } catch (err) {
                console.error('Error loading dashboard data:', err);
                if (isMounted) {
                    setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
                }
            } finally {
                if (isMounted) {
                    setLoadingData(false);
                }
            }
        };

        loadAllData();
        return () => {
            isMounted = false;
        };
    }, [fetchAvailableTables]);

    const stats = useMemo(() => ([
        { label: 'Tổng số bàn', value: availableTables.length, trend: '+3% so với hôm qua', accent: 'accent-green' },
        { label: 'Người dùng hoạt động', value: users.filter(u => u.is_active).length, trend: '+12%', accent: 'accent-orange' },
        { label: 'Sản phẩm đang bán', value: products.filter(p => p.is_available).length, trend: '+5%', accent: 'accent-purple' },
        { label: 'Danh mục món', value: categories.length, trend: 'ổn định', accent: 'accent-cyan' },
        { label: 'Đơn hàng tổng', value: orders.length, trend: '+18%', accent: 'accent-red' },
    ]), [availableTables.length, users, products, categories.length, orders.length]);

    const recentOrders = useMemo(() => {
        if (!orders.length) return [];
        return orders.slice(0, 4).map((order) => ({
            id: `#SO-${String(order.id).padStart(4, '0')}`,
            name: order.user?.full_name || order.user_full_name || 'Khách hàng',
            table: order.table?.number ? `Bàn ${order.table.number}` : 'Mang đi',
            total: `${(order.total_amount || 0).toLocaleString('vi-VN')}đ`,
            status: order.status,
        }));
    }, [orders]);

    const topProducts = useMemo(() => {
        const sorted = [...products].sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0));
        return sorted.slice(0, 5);
    }, [products]);

    const tasks = [
        { title: 'Xác nhận menu tuần sau', time: '10:00 AM', type: 'menu' },
        { title: 'Kiểm kê kho nguyên liệu', time: '01:30 PM', type: 'inventory' },
        { title: 'Họp với quản lý khu B', time: '03:00 PM', type: 'meeting' },
    ];

    const sidebarLinks = [
        { icon: '📊', label: 'Tổng quan', anchor: '#dashboard-overview' },
        { icon: '📈', label: 'Thống kê', anchor: '#dashboard-stats' },
        { icon: '🧾', label: 'Đơn hàng', path: '/admin/orders' },
        { icon: '🍔', label: 'Sản phẩm', path: '/admin/products' },
        { icon: '🏷️', label: 'Danh mục', path: '/admin/categories' },
        { icon: '🪑', label: 'Bàn ăn', path: '/admin/tables' },
        { icon: '👥', label: 'Người dùng', path: '/admin/users' },
        { icon: '✅', label: 'Công việc', anchor: '#dashboard-tasks' },
    ];

    if (loadingData) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn-primary">
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout" id="dashboard-overview">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <span>School Food Order</span>
                </div>
                <nav className="sidebar-nav">
                    {sidebarLinks.map((link) =>
                        link.path ? (
                            <Link key={link.label} to={link.path} className="sidebar-link">
                                <span className="icon">{link.icon}</span>
                                {link.label}
                            </Link>
                        ) : (
                            <a key={link.label} href={link.anchor} className="sidebar-link">
                                <span className="icon">{link.icon}</span>
                                {link.label}
                            </a>
                        )
                    )}
                </nav>
            </aside>

            <div className="admin-dashboard">
                <div className="dashboard-hero">
                <div>
                    <p className="dashboard-eyebrow">Xin chào {user?.full_name || user?.username || 'Administrator'}</p>
                    <h1>Trung tâm vận hành căn tin</h1>
                    <p>Giám sát bàn ăn, đơn hàng và hiệu suất khu vực trong một bảng điều khiển trực quan.</p>
                </div>
                <div className="dashboard-hero-card">
                    <h4>Hoạt động tức thời</h4>
                    <p><strong>{cart?.items?.length || 0}</strong> món đang có trong giỏ hàng hiện tại.</p>
                    <span>Đồng bộ thời gian thực với menu</span>
                </div>
                </div>

                <div className="dashboard-stats-grid" id="dashboard-stats">
                {stats.map((stat) => (
                    <div key={stat.label} className={`stat-card ${stat.accent}`}>
                        <p>{stat.label}</p>
                        <h3>{stat.value}</h3>
                        <span>{stat.trend}</span>
                    </div>
                ))}
                </div>

                <div className="dashboard-panels">
                <section className="panel analytics-panel">
                    <div className="panel-header">
                        <h3>Tình trạng bàn</h3>
                        <span>Realtime</span>
                    </div>
                    <div className="table-status-overview">
                        <div className="status-circle available">
                            <strong>{availableTables.filter(t => t.status === 'available').length}</strong>
                            <span>Bàn trống</span>
                        </div>
                        <div className="status-circle reserved">
                            <strong>{availableTables.filter(t => t.status === 'reserved').length}</strong>
                            <span>Đã đặt</span>
                        </div>
                        <div className="status-circle occupied">
                            <strong>{availableTables.filter(t => t.status === 'occupied').length}</strong>
                            <span>Đang dùng</span>
                        </div>
                    </div>
                    <div className="sparkline-placeholder">
                        <span>Biểu đồ lưu lượng theo giờ</span>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-header">
                        <h3>Đơn hàng gần nhất</h3>
                        <Link to="/admin/orders" className="link-button">Xem tất cả</Link>
                    </div>
                    <div className="recent-orders">
                        {recentOrders.length === 0 && <p className="empty-state-text">Chưa có đơn hàng nào.</p>}
                        {recentOrders.map((order) => (
                            <div key={order.id} className="order-row">
                                <div>
                                    <p className="order-id">{order.id}</p>
                                    <p className="order-meta">{order.name} • {order.table}</p>
                                </div>
                                <div className="order-info">
                                    <span>{order.total}</span>
                                    <span className={`status-pill ${order.status === 'completed' ? 'success' : order.status === 'in_delivery' ? 'info' : 'warning'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                </div>

                <section className="panel full-width data-table-panel" id="dashboard-products">
                <div className="panel-header">
                    <h3>Sản phẩm nổi bật</h3>
                    <div className="panel-actions">
                        <button className="btn-secondary">Xuất CSV</button>
                        <Link to="/admin/products" className="btn-primary">Thêm sản phẩm</Link>
                    </div>
                </div>
                <div className="responsive-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Tên món</th>
                                <th>Danh mục</th>
                                <th>Giá</th>
                                <th>Tồn kho</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.name}</td>
                                    <td>{categories.find(c => c.id === product.category_id)?.name || '—'}</td>
                                    <td>{(product.price || 0).toLocaleString('vi-VN')}đ</td>
                                    <td>{product.stock_quantity ?? '—'}</td>
                                    <td>
                                        <span className={`status-pill ${product.is_available ? 'success' : 'warning'}`}>
                                            {product.is_available ? 'Đang bán' : 'Tạm ngưng'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {topProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="empty-state-text">Chưa có dữ liệu sản phẩm.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </section>

                <section className="panel full-width">
                <div className="panel-header">
                    <h3>Quản lý nhanh</h3>
                </div>
                <div className="quick-management-grid">
                    <Link to="/admin/users" className="quick-management-card">
                        <span className="icon">👥</span>
                        <h4>Người dùng</h4>
                        <p>Quản lý tài khoản & phân quyền</p>
                    </Link>
                    <Link to="/admin/products" className="quick-management-card">
                        <span className="icon">🍔</span>
                        <h4>Sản phẩm</h4>
                        <p>Thêm, chỉnh sửa món ăn</p>
                    </Link>
                    <Link to="/admin/categories" className="quick-management-card">
                        <span className="icon">🏷️</span>
                        <h4>Danh mục</h4>
                        <p>Sắp xếp và tối ưu menu</p>
                    </Link>
                    <Link to="/admin/tables" className="quick-management-card">
                        <span className="icon">🪑</span>
                        <h4>Bàn ăn</h4>
                        <p>Điều chỉnh trạng thái bàn</p>
                    </Link>
                    <Link to="/admin/orders" className="quick-management-card">
                        <span className="icon">🧾</span>
                        <h4>Đơn hàng</h4>
                        <p>Theo dõi và xử lý đơn</p>
                    </Link>
                </div>
            </section>

            <section className="panel full-width">
                <div className="panel-header">
                    <h3>Công việc hôm nay</h3>
                    <button className="btn-secondary">Thêm mới</button>
                </div>
                <div className="task-grid">
                    {tasks.map((task) => (
                        <div key={task.title} className={`task-card ${task.type}`}>
                            <p className="task-title">{task.title}</p>
                            <span>{task.time}</span>
                        </div>
                    ))}
                </div>
                </section>
            </div>
        </div>
    );
};

export default DashBoard;
