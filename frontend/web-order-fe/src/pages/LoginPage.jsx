import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const LoginPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [banInfo, setBanInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
        setBanInfo(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setBanInfo(null);

        const result = await login(formData.username, formData.password);

        setLoading(false);

        if (result.success) {
            // Check user role and redirect accordingly
            if (result.user?.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/menu');
            }
        } else {
            // Check if error is related to banned account
            if (result.errorData && result.errorData.message) {
                setBanInfo({
                    message: result.errorData.message,
                    reason: result.errorData.ban_reason,
                    isPermanent: result.errorData.is_permanent,
                    bannedUntil: result.errorData.banned_until,
                    remainingDays: result.errorData.remaining_days,
                    remainingHours: result.errorData.remaining_hours
                });
            } else {
                setError(result.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
            }
        }
    };

    return (
        <div className="auth-page">
            <div className="container auth-wrapper">
                <div className="auth-visual">
                    <span className="auth-eyebrow">School Food Order</span>
                    <h1>Chạm vào tương lai ẩm thực học đường</h1>

                    <p className="auth-description">
                        Nền tảng đặt món đa vũ trụ với trải nghiệm nhanh, đẹp và đầy cảm hứng.
                        Khởi động ngày dài bằng những món ăn bạn yêu chỉ với vài thao tác.
                    </p>

                    <div className="metric-grid">
                        <div className="metric-card">
                            <span className="metric-icon">⚡</span>
                            <div>
                                <h3>2 phút</h3>
                                <p>Trung bình hoàn tất một đơn</p>
                            </div>
                        </div>
                        <div className="metric-card">
                            <span className="metric-icon">🍱</span>
                            <div>
                                <h3>150+</h3>
                                <p>Món ăn luôn sẵn sàng</p>
                            </div>
                        </div>
                    </div>

                    <ul className="auth-feature-list">
                        <li>Đồng bộ đa thiết bị &amp; thanh toán tức thì</li>
                        <li>Hệ thống thông minh gợi ý món theo lịch học</li>
                        <li>Thông báo realtime khi món đã sẵn sàng</li>
                    </ul>
                </div>

                <div className="auth-card auth-form-card">
                    <div className="auth-card-header">
                        <span className="auth-pill">Đăng nhập</span>
                        <h2>Xin chào, bạn đã sẵn sàng?</h2>
                        <p>Truy cập bảng điều khiển món ăn để đặt món trong tích tắc.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {/* Ban Info Message */}
                    {banInfo && (
                        <div className="ban-message">
                            <div className="ban-header">
                                <span className="ban-icon">🚫</span>
                                <h3>Tài khoản bị khóa</h3>
                            </div>
                            <div className="ban-content">
                                <p className="ban-main-message">{banInfo.message}</p>

                                {banInfo.reason && (
                                    <div className="ban-reason">
                                        <strong>Lý do:</strong>
                                        <p>{banInfo.reason}</p>
                                    </div>
                                )}

                                {!banInfo.isPermanent && banInfo.remainingDays !== undefined && (
                                    <div className="ban-duration">
                                        <div className="ban-time-info">
                                            <span className="time-badge">
                                                ⏱️ Còn lại: {banInfo.remainingDays > 0
                                                    ? `${banInfo.remainingDays} ngày ${Math.round(banInfo.remainingHours % 24)} giờ`
                                                    : `${Math.round(banInfo.remainingHours)} giờ`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {banInfo.isPermanent && (
                                    <div className="ban-permanent">
                                        <span className="permanent-badge">⚠️ Khóa vĩnh viễn</span>
                                    </div>
                                )}

                                <div className="ban-contact">
                                    <p>
                                        💬 Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ với quản trị viên để được hỗ trợ.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Email</label>
                            <input
                                type="email"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Nhập email của bạn"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-submit btn-login-cta"
                            disabled={loading}
                        >
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Chưa có tài khoản?
                            <Link to="/register" className="auth-link"> Đăng ký ngay</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;