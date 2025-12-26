import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { formatPhone, isValidEmail, isValidPhone } from '../utils/helpers';

const roleBadges = {
    admin: { label: 'Quản trị viên', color: '#ff9a62' },
    staff: { label: 'Nhân viên', color: '#76d3ff' },
    customer: { label: 'Khách hàng', color: '#a5ffb4' },
};

const ProfilePage = () => {
    const { user, updateProfile, changePassword } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
    });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState({ type: null, message: '', loading: false });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordStatus, setPasswordStatus] = useState({ type: null, message: '', loading: false });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const roleInfo = useMemo(() => {
        if (!user) {
            return roleBadges.customer;
        }
        return roleBadges[user.role] || roleBadges.customer;
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (passwordErrors[name]) {
            setPasswordErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
        if (passwordStatus.message) {
            setPasswordStatus({ type: null, message: '', loading: false });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordStatus({ type: null, message: '', loading: true });

        const validationErrors = validatePasswordForm();
        if (Object.keys(validationErrors).length) {
            setPasswordErrors(validationErrors);
            setPasswordStatus({ type: 'error', message: 'Vui lòng kiểm tra lại thông tin.', loading: false });
            return;
        }

        const result = await changePassword({
            currentPassword: passwordData.currentPassword.trim(),
            newPassword: passwordData.newPassword.trim(),
        });

        if (!result.success) {
            setPasswordStatus({ type: 'error', message: result.error, loading: false });
            return;
        }

        setPasswordStatus({ type: 'success', message: 'Đổi mật khẩu thành công!', loading: false });
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setPasswordErrors({});
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Vui lòng nhập họ và tên';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!isValidEmail(formData.email.trim())) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (formData.phone && !isValidPhone(formData.phone.trim())) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        return newErrors;
    };

    const validatePasswordForm = () => {
        const pwdErrors = {};

        if (!passwordData.currentPassword.trim()) {
            pwdErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        }

        if (!passwordData.newPassword.trim()) {
            pwdErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (passwordData.newPassword.length < 6) {
            pwdErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
        }

        if (passwordData.newPassword === passwordData.currentPassword && passwordData.newPassword) {
            pwdErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }

        if (!passwordData.confirmPassword.trim()) {
            pwdErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới';
        } else if (passwordData.confirmPassword !== passwordData.newPassword) {
            pwdErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        return pwdErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setStatus({ type: null, message: '', loading: true });

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            setStatus({ type: 'error', message: 'Vui lòng kiểm tra lại thông tin.', loading: false });
            return;
        }

        try {
            const payload = {
                full_name: formData.full_name.trim(),
                email: formData.email.trim(),
                phone: formData.phone?.trim() || null,
            };

            const result = await updateProfile(payload);
            if (!result.success) {
                setStatus({ type: 'error', message: result.error, loading: false });
                return;
            }

            setStatus({ type: 'success', message: 'Cập nhật thông tin thành công!', loading: false });
            setIsEditing(false);
        } catch (error) {
            setStatus({
                type: 'error',
                message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
                loading: false,
            });
        }
    };

    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Đang tải hồ sơ...</p>
            </div>
        );
    }

    const profileStats = [
        { label: 'Vai trò', value: roleInfo.label, icon: '🎫' },
        { label: 'Trạng thái', value: user.is_active ? 'Đang hoạt động' : 'Bị khóa', icon: '🟢' },
    ];

    return (
        <div className="profile-page">
            <div className="profile-gradient" />
            <div className="profile-wrapper">
                <section className="profile-hero">
                    <div className="hero-pill">Hồ sơ cá nhân</div>
                    <h1>Xin chào, {user.full_name || user.username}</h1>
                    <p>
                        Quản lý thông tin và giữ hồ sơ của bạn luôn được cập nhật để hệ thống cá nhân hóa trải nghiệm đặt món.
                    </p>
                    <div className="hero-meta">
                        <div className="meta-avatar">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div>
                            <div className="meta-name">{user.full_name || user.username}</div>
                            <div className="meta-role" style={{ color: roleInfo.color }}>
                                {roleInfo.label}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="profile-content">
                    <aside className="profile-sidecard">
                        <h3>Thông tin nhanh</h3>

                        <div className="profile-stat-grid">
                            {profileStats.map((stat) => (
                                <div key={stat.label} className="profile-stat-card">
                                    <span className="stat-icon">{stat.icon}</span>
                                    <div className="stat-label">{stat.label}</div>
                                    <div className="stat-value">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                        <div className="profile-side-info">
                            <div>
                                <span className="info-label">Mã người dùng</span>
                                <p>#{user.id}</p>
                            </div>
                            {user.student_id && (
                                <div>
                                    <span className="info-label">Mã sinh viên</span>
                                    <p>{user.student_id}</p>
                                </div>
                            )}
                            {user.class_name && (
                                <div>
                                    <span className="info-label">Lớp</span>
                                    <p>{user.class_name}</p>
                                </div>
                            )}
                        </div>
                    </aside>

                    <div className="profile-main-grid">
                        <section className="profile-maincard">
                            <div className="profile-card-header">
                                <div>
                                    <p className="eyebrow">Thông tin cá nhân</p>
                                    <h2>Tùy chỉnh hồ sơ của bạn</h2>
                                </div>
                                <div className="header-actions">
                                    {!isEditing && (
                                        <button className="btn-ghost" onClick={() => setIsEditing(true)}>
                                            ✏️ Chỉnh sửa
                                        </button>
                                    )}
                                </div>
                            </div>

                            {status.message && (
                                <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                                    {status.message}
                                </div>
                            )}

                            {isEditing ? (
                                <form className="profile-form" onSubmit={handleSubmit}>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label htmlFor="full_name">Họ và tên</label>
                                            <input
                                                type="text"
                                                id="full_name"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                className={errors.full_name ? 'error' : ''}
                                                placeholder="Nhập họ và tên"
                                            />
                                            {errors.full_name && <span className="field-error">{errors.full_name}</span>}
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={errors.email ? 'error' : ''}
                                                placeholder="name@student.edu.vn"
                                            />
                                            {errors.email && <span className="field-error">{errors.email}</span>}
                                        </div>

                                        <div className="form-field">
                                            <label htmlFor="phone">Số điện thoại</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className={errors.phone ? 'error' : ''}
                                                placeholder="0xxx xxx xxx"
                                            />
                                            {errors.phone && <span className="field-error">{errors.phone}</span>}
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" className="btn-secondary" onClick={() => {
                                            setIsEditing(false);
                                            setErrors({});
                                            setStatus({ type: null, message: '', loading: false });
                                            setFormData({
                                                full_name: user.full_name || '',
                                                email: user.email || '',
                                                phone: user.phone || '',
                                            });
                                        }}>
                                            Hủy
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={status.loading}>
                                            {status.loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-info-grid">
                                    <div>
                                        <span className="info-label">Họ và tên</span>
                                        <h4>{user.full_name || 'Chưa cập nhật'}</h4>
                                    </div>

                                    <div>
                                        <span className="info-label">Email</span>
                                        <h4>{user.email || 'Chưa cập nhật'}</h4>
                                    </div>

                                    <div>
                                        <span className="info-label">Số điện thoại</span>
                                        <h4>{user.phone ? formatPhone(user.phone) : 'Chưa cập nhật'}</h4>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="profile-maincard profile-password-card">
                            <div className="profile-card-header">
                                <div>
                                    <p className="eyebrow">Bảo mật</p>
                                    <h2>Đổi mật khẩu</h2>
                                </div>
                            </div>

                            {passwordStatus.message && (
                                <div className={`alert ${passwordStatus.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                                    {passwordStatus.message}
                                </div>
                            )}

                            <form className="profile-form" onSubmit={handlePasswordSubmit}>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordInputChange}
                                            className={passwordErrors.currentPassword ? 'error' : ''}
                                            placeholder="Nhập mật khẩu hiện tại"
                                        />
                                        {passwordErrors.currentPassword && (
                                            <span className="field-error">{passwordErrors.currentPassword}</span>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="newPassword">Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordInputChange}
                                            className={passwordErrors.newPassword ? 'error' : ''}
                                            placeholder="Ít nhất 6 ký tự"
                                        />
                                        {passwordErrors.newPassword && (
                                            <span className="field-error">{passwordErrors.newPassword}</span>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordInputChange}
                                            className={passwordErrors.confirmPassword ? 'error' : ''}
                                            placeholder="Nhập lại mật khẩu mới"
                                        />
                                        {passwordErrors.confirmPassword && (
                                            <span className="field-error">{passwordErrors.confirmPassword}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            setPasswordData({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: '',
                                            });
                                            setPasswordErrors({});
                                            setPasswordStatus({ type: null, message: '', loading: false });
                                        }}
                                    >
                                        Xóa
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={passwordStatus.loading}>
                                        {passwordStatus.loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;