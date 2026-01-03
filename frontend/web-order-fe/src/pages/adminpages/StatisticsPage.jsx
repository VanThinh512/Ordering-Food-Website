import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import statisticsService from '../../services/Statistics';

const COLORS = ['#ff9a62', '#62d1ff', '#62ff9a', '#ffd062', '#ff6262', '#9a62ff'];

const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const ORDER_STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    ready: 'Sẵn sàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};

const RESERVATION_STATUS_LABELS = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    active: 'Đang diễn ra',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
};

const StatisticsPage = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedRevenueYear, setSelectedRevenueYear] = useState(currentYear);
    const [selectedRevenueMonth, setSelectedRevenueMonth] = useState('all');

    const [overview, setOverview] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [ordersData, setOrdersData] = useState(null);
    const [reservationsData, setReservationsData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load overview statistics
    useEffect(() => {
        const loadOverview = async () => {
            try {
                const data = await statisticsService.getOverview();
                setOverview(data);
            } catch (error) {
                console.error('Error loading overview:', error);
            }
        };
        loadOverview();
    }, []);

    // Load revenue data
    useEffect(() => {
        const loadRevenue = async () => {
            try {
                const params = { year: selectedRevenueYear };
                if (selectedRevenueMonth !== 'all') {
                    params.month = parseInt(selectedRevenueMonth);
                }
                const data = await statisticsService.getRevenue(params);
                setRevenueData(data);
            } catch (error) {
                console.error('Error loading revenue:', error);
            }
        };
        loadRevenue();
    }, [selectedRevenueYear, selectedRevenueMonth]);

    // Load orders statistics
    useEffect(() => {
        const loadOrders = async () => {
            try {
                const params = { year: selectedYear };
                if (selectedMonth !== 'all') {
                    params.month = parseInt(selectedMonth);
                }
                const data = await statisticsService.getOrders(params);
                setOrdersData(data);
            } catch (error) {
                console.error('Error loading orders:', error);
            }
        };
        loadOrders();
    }, [selectedYear, selectedMonth]);

    // Load reservations statistics
    useEffect(() => {
        const loadReservations = async () => {
            setLoading(true);
            try {
                const params = { year: selectedYear };
                if (selectedMonth !== 'all') {
                    params.month = parseInt(selectedMonth);
                }
                const data = await statisticsService.getReservations(params);
                setReservationsData(data);
            } catch (error) {
                console.error('Error loading reservations:', error);
            } finally {
                setLoading(false);
            }
        };
        loadReservations();
    }, [selectedYear, selectedMonth]);

    // Format revenue chart data
    const getRevenueChartData = () => {
        if (!revenueData || !revenueData.data) return [];
        
        if (revenueData.period === 'monthly') {
            // Monthly data for the year
            return revenueData.data.map(item => ({
                name: MONTH_NAMES[item.month - 1],
                'Doanh thu': item.revenue,
                'Số đơn': item.order_count
            }));
        } else {
            // Daily data for a month
            return revenueData.data.map(item => ({
                name: `Ngày ${item.day}`,
                'Doanh thu': item.revenue,
                'Số đơn': item.order_count
            }));
        }
    };

    // Format orders pie chart data
    const getOrdersChartData = () => {
        if (!ordersData || !ordersData.by_status) return [];
        
        return Object.entries(ordersData.by_status)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => ({
                name: ORDER_STATUS_LABELS[status] || status,
                value: count
            }));
    };

    // Format reservations bar chart data
    const getReservationsChartData = () => {
        if (!reservationsData || !reservationsData.breakdown) return [];
        
        if (selectedMonth !== 'all') {
            // Daily data
            return reservationsData.breakdown.map(item => ({
                name: `Ngày ${item.day}`,
                'Số lượng': item.count
            }));
        } else {
            // Monthly data - only show months with data
            return reservationsData.breakdown.map(item => ({
                name: MONTH_NAMES[item.month - 1],
                'Số lượng': item.count
            }));
        }
    };

    // Format reservations by status
    const getReservationsByStatus = () => {
        if (!reservationsData || !reservationsData.by_status) return [];
        
        return Object.entries(reservationsData.by_status)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => ({
                name: RESERVATION_STATUS_LABELS[status] || status,
                value: count
            }));
    };

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    if (loading && !overview) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu thống kê...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout">
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <span>School Food Order</span>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/admin/dashboard" className="sidebar-link">
                        <span className="icon">📊</span>
                        Tổng quan
                    </Link>
                    <Link to="/admin/statistics" className="sidebar-link active">
                        <span className="icon">📈</span>
                        Thống kê
                    </Link>
                    <Link to="/admin/orders" className="sidebar-link">
                        <span className="icon">🧾</span>
                        Đơn hàng
                    </Link>
                    <Link to="/admin/products" className="sidebar-link">
                        <span className="icon">🍔</span>
                        Sản phẩm
                    </Link>
                    <Link to="/admin/categories" className="sidebar-link">
                        <span className="icon">🏷️</span>
                        Danh mục
                    </Link>
                    <Link to="/admin/tables" className="sidebar-link">
                        <span className="icon">🪑</span>
                        Bàn ăn
                    </Link>
                    <Link to="/admin/users" className="sidebar-link">
                        <span className="icon">👥</span>
                        Người dùng
                    </Link>
                </nav>
            </aside>

            <div className="admin-dashboard statistics-page">
                <div className="dashboard-hero">
                    <div>
                        <p className="dashboard-eyebrow">Thống kê & Báo cáo</p>
                        <h1>Phân tích dữ liệu kinh doanh</h1>
                        <p>Xem biểu đồ chi tiết về đặt bàn, đơn hàng và doanh thu</p>
                    </div>
                </div>

                {/* Overview Cards */}
                {overview && (
                    <div className="dashboard-stats-grid">
                        <div className="stat-card accent-green">
                            <p>Tổng đơn hàng</p>
                            <h3>{overview.total_orders}</h3>
                            <span>{overview.completed_orders} đơn hoàn thành</span>
                        </div>
                        <div className="stat-card accent-orange">
                            <p>Doanh thu (đơn hoàn thành)</p>
                            <h3>{overview.total_revenue.toLocaleString('vi-VN')}đ</h3>
                            <span>Tổng cộng</span>
                        </div>
                        <div className="stat-card accent-purple">
                            <p>Tổng đặt bàn</p>
                            <h3>{overview.total_reservations}</h3>
                            <span>{overview.active_reservations} đang hoạt động</span>
                        </div>
                        <div className="stat-card accent-cyan">
                            <p>Tỷ lệ hoàn thành đơn</p>
                            <h3>{overview.total_orders > 0 ? ((overview.completed_orders / overview.total_orders) * 100).toFixed(1) : 0}%</h3>
                            <span>Hiệu suất</span>
                        </div>
                    </div>
                )}

                {/* Revenue Chart */}
                <section className="panel full-width">
                    <div className="panel-header">
                        <h3>📊 Thống kê Doanh thu (Chỉ tính đơn hoàn thành)</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select 
                                value={selectedRevenueYear} 
                                onChange={(e) => setSelectedRevenueYear(parseInt(e.target.value))}
                                className="filter-select"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select 
                                value={selectedRevenueMonth} 
                                onChange={(e) => setSelectedRevenueMonth(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">Cả năm</option>
                                {MONTH_NAMES.map((name, idx) => (
                                    <option key={idx + 1} value={idx + 1}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ padding: '20px', minHeight: '400px' }}>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={getRevenueChartData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis dataKey="name" stroke="rgba(226, 232, 240, 0.65)" />
                                <YAxis yAxisId="left" stroke="rgba(226, 232, 240, 0.65)" />
                                <YAxis yAxisId="right" orientation="right" stroke="rgba(226, 232, 240, 0.65)" />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'rgba(20, 20, 40, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                    formatter={(value, name) => {
                                        if (name === 'Doanh thu') {
                                            return [`${value.toLocaleString('vi-VN')}đ`, name];
                                        }
                                        return [value, name];
                                    }}
                                />
                                <Legend wrapperStyle={{ color: 'rgba(226, 232, 240, 0.85)' }} />
                                <Bar 
                                    yAxisId="left" 
                                    dataKey="Doanh thu" 
                                    fill="#ff9a62" 
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar 
                                    yAxisId="right" 
                                    dataKey="Số đơn" 
                                    fill="#62d1ff" 
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Orders Statistics */}
                <section className="panel full-width">
                    <div className="panel-header">
                        <h3>🧾 Đơn hàng theo trạng thái</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="filter-select"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">Cả năm</option>
                                {MONTH_NAMES.map((name, idx) => (
                                    <option key={idx + 1} value={idx + 1}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="chart-container">
                        {ordersData && (
                            <div className="chart-summary">
                                <p>Tổng: <strong>{ordersData.total}</strong> đơn hàng</p>
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={getOrdersChartData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {getOrdersChartData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'rgba(20, 20, 40, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '8px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    wrapperStyle={{ 
                                        paddingTop: '20px',
                                        fontSize: '14px',
                                        color: 'rgba(226, 232, 240, 0.85)'
                                    }}
                                    formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Reservations Timeline Chart */}
                <section className="panel full-width">
                    <div className="panel-header">
                        <h3>📅 Lượng đặt bàn theo thời gian</h3>
                        <p style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)', margin: '0.5rem 0 0 0' }}>
                            {selectedMonth === 'all' ? 'Theo tháng (chỉ hiển thị tháng có dữ liệu)' : `Theo ngày - ${MONTH_NAMES[parseInt(selectedMonth) - 1]}`}
                        </p>
                    </div>
                    <div style={{ padding: '20px', minHeight: '400px' }}>
                        {getReservationsChartData().length === 0 ? (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '350px',
                                color: 'rgba(226, 232, 240, 0.5)',
                                fontSize: '18px'
                            }}>
                                Chưa có dữ liệu đặt bàn trong khoảng thời gian này
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={getReservationsChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                    <XAxis dataKey="name" stroke="rgba(226, 232, 240, 0.65)" />
                                    <YAxis stroke="rgba(226, 232, 240, 0.65)" />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: 'rgba(20, 20, 40, 0.95)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ color: 'rgba(226, 232, 240, 0.85)' }} />
                                    <Bar dataKey="Số lượng" fill="#62ff9a" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StatisticsPage;
