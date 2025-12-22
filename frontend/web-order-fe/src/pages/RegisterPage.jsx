import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const RegisterPage = () => {
    const navigate = useNavigate();
    const register = useAuthStore((state) => state.register);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone_number: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        setError('');

        const { confirmPassword, ...registerData } = formData;
        const result = await register(registerData);

        setLoading(false);

        if (result.success) {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } else {
            setError(result.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="auth-page">
            <div className="container auth-wrapper">
                <div className="auth-visual register-visual">
                    <span className="auth-eyebrow">Khởi động tài khoản</span>
                    <h1>Cùng xây cầu nối ẩm thực học đường</h1>
                    <p className="auth-description">
                        Chỉ vài bước để kích hoạt trải nghiệm đặt món đa kênh, đồng bộ giữa lịch học,
                        bạn bè và quầy phục vụ. Tạo hồ sơ cá nhân để hệ thống gợi ý món yêu thích chính xác hơn.
                    </p>

                    <div className="progress-tracker">
                        <div className="progress-step active">
                            <span>01</span>
                            <p>Nhập thông tin</p>
                        </div>
                        <div className="progress-step active">
                            <span>02</span>
                            <p>Xác thực</p>
                        </div>
                        <div className="progress-step">
                            <span>03</span>
                            <p>Sẵn sàng đặt món</p>
                        </div>
                    </div>

                    <ul className="auth-feature-list">
                        <li>Đồng bộ lớp học và lịch đặt món mỗi tuần</li>
                        <li>Ưu tiên xử lý khi đặt theo nhóm hoặc sự kiện</li>
                        <li>Cập nhật thông báo realtime từ căn tin</li>
                    </ul>
                </div>

                <div className="auth-card auth-form-card register-form-card">
                    <div className="auth-card-header">
                        <span className="auth-pill">Đăng ký</span>
                        <h2>Hoàn tất trong chưa đầy 2 phút</h2>
                        <p>Điền thông tin chính xác để hệ thống cá nhân hóa trải nghiệm của bạn.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="full_name">Họ và tên</label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Nhập họ và tên"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Nhập email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone_number">Số điện thoại</label>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Mật khẩu</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Tối thiểu 6 ký tự"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Đã có tài khoản?
                            <Link to="/login" className="auth-link"> Đăng nhập</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;