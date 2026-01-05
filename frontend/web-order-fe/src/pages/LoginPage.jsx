import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axios from '../config/axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
    
    // 2FA state
    const [requires2FA, setRequires2FA] = useState(false);
    const [userId, setUserId] = useState(null);
    const [twoFACode, setTwoFACode] = useState('');

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
            // Check if 2FA is required
            if (result.requires2FA) {
                setRequires2FA(true);
                setUserId(result.userId);
                return;
            }
            
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

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/auth/2fa/verify', null, {
                params: {
                    user_id: userId,
                    token: twoFACode
                }
            });

            // Save token and load user
            const token = response.data.access_token;
            localStorage.setItem('access_token', token);
            
            // Load user data
            const loadUser = useAuthStore.getState().loadUser;
            await loadUser();
            
            const user = useAuthStore.getState().user;
            
            // Redirect based on role
            if (user?.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/menu');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Mã 2FA không đúng');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Get authorization URL from backend
            const response = await fetch(`${API_URL}/auth/google/login`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to initialize Google login');
            }
            
            // Redirect to Google login
            window.location.href = data.authorization_url;
        } catch (err) {
            console.error('Google login error:', err);
            setError(err.message || 'Không thể đăng nhập bằng Google. Vui lòng thử lại sau.');
            setLoading(false);
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

                    {/* 2FA Verification */}
                    {requires2FA ? (
                        <div className="two-fa-verification">
                            <div className="two-fa-header">
                                <span className="two-fa-icon">🔐</span>
                                <h3>Xác thực 2 lớp</h3>
                                <p>Nhập mã 6 số từ Google Authenticator</p>
                            </div>

                            <form onSubmit={handle2FASubmit} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="two-fa-code">Mã xác thực</label>
                                    <input
                                        type="text"
                                        id="two-fa-code"
                                        value={twoFACode}
                                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength="6"
                                        pattern="[0-9]{6}"
                                        required
                                        autoFocus
                                        style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-submit btn-login-cta"
                                    disabled={twoFACode.length !== 6 || loading}
                                >
                                    {loading ? 'Đang xác thực...' : 'Xác nhận'}
                                </button>

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setRequires2FA(false);
                                        setTwoFACode('');
                                        setUserId(null);
                                        setError('');
                                    }}
                                    style={{ marginTop: '10px', width: '100%' }}
                                >
                                    Quay lại
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
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

                            <div className="divider-container">
                                <div className="divider-line"></div>
                                <span className="divider-text">hoặc</span>
                                <div className="divider-line"></div>
                            </div>

                            <button
                                type="button"
                                className="btn-google-login"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z" fill="#4285F4"/>
                                    <path d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z" fill="#34A853"/>
                                    <path d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40664 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z" fill="#FBBC05"/>
                                    <path d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z" fill="#EA4335"/>
                                </svg>
                                Đăng nhập bằng Google
                            </button>

                            <div className="auth-footer">
                                <p>
                                    Chưa có tài khoản?
                                    <Link to="/register" className="auth-link"> Đăng ký ngay</Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;