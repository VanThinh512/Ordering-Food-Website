import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

const ProfilePage = () => {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // TODO: Implement update profile API
        alert('Chức năng cập nhật thông tin đang được phát triển');
        setIsEditing(false);
    };

    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-container">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <h1>{user.full_name || user.username}</h1>
                        <p className="profile-role">
                            {user.role === 'admin' ? 'Quản trị viên' :
                                user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                        </p>
                    </div>

                    <div className="profile-card">
                        <div className="profile-card-header">
                            <h2>Thông tin cá nhân</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-edit"
                                >
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="profile-form">
                                <div className="form-group">
                                    <label htmlFor="full_name">Họ và tên</label>
                                    <input
                                        type="text"
                                        id="full_name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="form-input"
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
                                        className="form-input"
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
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-primary">
                                        Lưu thay đổi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="btn-secondary"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-info">
                                <div className="info-row">
                                    <span className="info-label">Tên đăng nhập:</span>
                                    <span className="info-value">{user.username}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Họ và tên:</span>
                                    <span className="info-value">{user.full_name || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{user.email || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Số điện thoại:</span>
                                    <span className="info-value">{user.phone_number || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;