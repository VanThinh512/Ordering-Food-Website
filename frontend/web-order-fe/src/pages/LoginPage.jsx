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
        setLoading(true);
        setError('');

        const result = await login(formData.username, formData.password);

        setLoading(false);

        if (result.success) {
            navigate('/menu');
        } else {
            setError(result.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Đăng nhập</h2>
                    <p className="auth-subtitle">Chào mừng bạn trở lại!</p>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Tên đăng nhập hoặc Email</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Nhập tên đăng nhập hoặc email"
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
                            className="btn-submit"
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