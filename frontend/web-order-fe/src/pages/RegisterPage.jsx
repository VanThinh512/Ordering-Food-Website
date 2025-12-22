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
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Đăng ký</h2>
                    <p className="auth-subtitle">Tạo tài khoản mới</p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
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

                        <div className="form-group">
                            <label htmlFor="username">Tên đăng nhập</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Nhập tên đăng nhập"
                                required
                            />
                        </div>

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

                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
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