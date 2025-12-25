import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import userService from '../../services/User';

const UserManagementPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedUser, setSelectedUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        phone: '',
        password: '',
        role: 'customer',
        is_active: true
    });

    const [formErrors, setFormErrors] = useState({});

    const USER_ROLES = {
        admin: { label: 'Quản trị viên', color: '#dc3545', icon: '👑' },
        staff: { label: 'Nhân viên', color: '#17a2b8', icon: '👨‍💼' },
        customer: { label: 'Khách hàng', color: '#28a745', icon: '👤' }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang này!');
            navigate('/');
            return;
        }

        loadUsers();
    }, [isAuthenticated, user]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading users...');
            const data = await userService.getAll();
            setUsers(data);
            console.log('✅ Loaded users:', data.length);
        } catch (error) {
            console.error('❌ Error loading users:', error);

            if (error.message?.includes('đăng nhập')) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate('/login');
                return;
            }

            alert('Không thể tải danh sách người dùng. ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        // Filter by role
        if (selectedRole !== 'all' && u.role !== selectedRole) {
            return false;
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            return (
                u.username?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                u.full_name?.toLowerCase().includes(term) ||
                u.phone?.toLowerCase().includes(term)
            );
        }

        return true;
    });

    const getRoleCount = (role) => {
        if (role === 'all') return users.length;
        return users.filter(u => u.role === role).length;
    };

    const openModal = (mode, userData = null) => {
        setModalMode(mode);
        setSelectedUser(userData);

        if (mode === 'add') {
            setFormData({
                username: '',
                email: '',
                full_name: '',
                phone: '',
                password: '',
                role: 'customer',
                is_active: true
            });
        } else if (mode === 'edit' && userData) {
            setFormData({
                username: userData.username,
                email: userData.email,
                full_name: userData.full_name || '',
                phone: userData.phone || '',
                password: '', // Không hiển thị password cũ
                role: userData.role,
                is_active: userData.is_active ?? true
            });
        } else if (mode === 'view' && userData) {
            setFormData({
                username: userData.username,
                email: userData.email,
                full_name: userData.full_name || '',
                phone: userData.phone || '',
                password: '',
                role: userData.role,
                is_active: userData.is_active ?? true
            });
        }

        setFormErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormData({
            username: '',
            email: '',
            full_name: '',
            phone: '',
            password: '',
            role: 'customer',
            is_active: true
        });
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user types
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        // Username validation
        if (!formData.username.trim()) {
            errors.username = 'Tên đăng nhập không được để trống';
        } else if (formData.username.length < 3) {
            errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email không hợp lệ';
        }

        // Password validation (chỉ khi thêm mới hoặc có nhập password)
        if (modalMode === 'add') {
            if (!formData.password) {
                errors.password = 'Mật khẩu không được để trống';
            } else if (formData.password.length < 6) {
                errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            }
        } else if (modalMode === 'edit' && formData.password && formData.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        // Phone validation (optional)
        if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
            errors.phone = 'Số điện thoại không hợp lệ';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const userData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                full_name: formData.full_name.trim() || null,
                phone: formData.phone.trim() || null,
                role: formData.role,
                is_active: formData.is_active
            };

            // Chỉ gửi password nếu có nhập
            if (formData.password) {
                userData.password = formData.password;
            }

            console.log('📤 Submitting user data:', userData);

            if (modalMode === 'add') {
                await userService.create(userData);
                alert('✅ Thêm người dùng thành công!');
            } else if (modalMode === 'edit') {
                await userService.update(selectedUser.id, userData);
                alert('✅ Cập nhật người dùng thành công!');
            }

            closeModal();
            await loadUsers();
        } catch (error) {
            console.error('❌ Error submitting user:', error);

            let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';

            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    const errors = error.response.data.detail
                        .map(err => `${err.loc?.join('.')}: ${err.msg}`)
                        .join('\n');
                    errorMessage = `Lỗi validation:\n${errors}`;
                } else {
                    errorMessage = error.response.data.detail;
                }
            }

            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (userId, username) => {
        if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${username}"?\nHành động này không thể hoàn tác.`)) {
            return;
        }

        // Không cho phép xóa chính mình
        if (userId === user.id) {
            alert('❌ Bạn không thể xóa tài khoản của chính mình!');
            return;
        }

        try {
            console.log('🗑️ Deleting user:', userId);
            await userService.delete(userId);
            alert('✅ Xóa người dùng thành công!');
            await loadUsers();
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            alert(error.response?.data?.detail || 'Không thể xóa người dùng');
        }
    };

    // Ban user function
    const handleBanUser = async (userId, username) => {
        // Không cho phép ban chính mình
        if (userId === user.id) {
            alert('❌ Bạn không thể khóa tài khoản của chính mình!');
            return;
        }

        const reason = window.prompt(`Bạn có chắc muốn khóa tài khoản "${username}"?\n\nVui lòng nhập lý do khóa tài khoản:`);

        if (reason === null) {
            return; // User cancelled
        }

        if (!reason.trim()) {
            alert('❌ Vui lòng nhập lý do khóa tài khoản!');
            return;
        }

        try {
            console.log('🚫 Banning user:', userId);
            await userService.banUser(userId);
            alert(`✅ Đã khóa tài khoản "${username}" thành công!\nLý do: ${reason}`);
            await loadUsers();
        } catch (error) {
            console.error('❌ Error banning user:', error);
            alert(error.response?.data?.detail || 'Không thể khóa tài khoản người dùng');
        }
    };

    // Unban user function
    const handleUnbanUser = async (userId, username) => {
        if (!window.confirm(`Bạn có chắc muốn mở khóa tài khoản "${username}"?`)) {
            return;
        }

        try {
            console.log('✅ Unbanning user:', userId);
            await userService.unbanUser(userId);
            alert(`✅ Đã mở khóa tài khoản "${username}" thành công!`);
            await loadUsers();
        } catch (error) {
            console.error('❌ Error unbanning user:', error);
            alert(error.response?.data?.detail || 'Không thể mở khóa tài khoản người dùng');
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="user-management-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <span className="title-icon">👥</span>
                            Quản lý người dùng
                        </h1>
                        <p className="page-subtitle">
                            Quản lý tài khoản và phân quyền người dùng trong hệ thống
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <span className="stat-label">Tổng người dùng</span>
                            <strong className="stat-value">{users.length}</strong>
                        </div>
                    </div>
                    <div className="stat-card stat-admin">
                        <div className="stat-icon">👑</div>
                        <div className="stat-content">
                            <span className="stat-label">Quản trị viên</span>
                            <strong className="stat-value">{getRoleCount('admin')}</strong>
                        </div>
                    </div>
                    <div className="stat-card stat-staff">
                        <div className="stat-icon">👨‍💼</div>
                        <div className="stat-content">
                            <span className="stat-label">Nhân viên</span>
                            <strong className="stat-value">{getRoleCount('staff')}</strong>
                        </div>
                    </div>
                    <div className="stat-card stat-customer">
                        <div className="stat-icon">👤</div>
                        <div className="stat-content">
                            <span className="stat-label">Khách hàng</span>
                            <strong className="stat-value">{getRoleCount('customer')}</strong>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, số điện thoại..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search-btn"
                                onClick={() => setSearchTerm('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="role-filter">
                        <button
                            className={`role-filter-btn ${selectedRole === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('all')}
                        >
                            Tất cả ({getRoleCount('all')})
                        </button>
                        {Object.entries(USER_ROLES).map(([role, info]) => (
                            <button
                                key={role}
                                className={`role-filter-btn ${selectedRole === role ? 'active' : ''}`}
                                onClick={() => setSelectedRole(role)}
                                style={{
                                    '--role-color': info.color,
                                    borderColor: selectedRole === role ? info.color : 'transparent'
                                }}
                            >
                                {info.icon} {info.label} ({getRoleCount(role)})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h2>Không tìm thấy người dùng</h2>
                        <p>
                            {searchTerm
                                ? 'Thử tìm kiếm với từ khóa khác'
                                : selectedRole !== 'all'
                                    ? `Chưa có người dùng "${USER_ROLES[selectedRole].label}"`
                                    : 'Chưa có người dùng nào trong hệ thống'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên đăng nhập</th>
                                    <th>Họ tên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => {
                                    const roleInfo = USER_ROLES[u.role] || USER_ROLES.customer;
                                    const isCurrentUser = u.id === user.id;

                                    return (
                                        <tr key={u.id} className={isCurrentUser ? 'current-user' : ''}>
                                            <td>
                                                <strong className="user-id">#{u.id}</strong>
                                            </td>
                                            <td>
                                                <div className="username-cell">
                                                    <strong>{u.username}</strong>
                                                    {isCurrentUser && (
                                                        <span className="current-badge">Bạn</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{u.full_name || '-'}</td>
                                            <td>
                                                <a href={`mailto:${u.email}`} className="email-link">
                                                    {u.email}
                                                </a>
                                            </td>
                                            <td>{u.phone || '-'}</td>
                                            <td>
                                                <span
                                                    className="role-badge"
                                                    style={{
                                                        background: roleInfo.color + '20',
                                                        color: roleInfo.color,
                                                        borderColor: roleInfo.color
                                                    }}
                                                >
                                                    {roleInfo.icon} {roleInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                                    {u.is_active ? '✓ Hoạt động' : '🚫 Bị khóa'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="date-text">
                                                    {formatDateTime(u.created_at)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-action btn-view"
                                                        onClick={() => openModal('view', u)}
                                                        title="Xem chi tiết"
                                                    >
                                                        👁️
                                                    </button>
                                                    <button
                                                        className="btn-action btn-edit"
                                                        onClick={() => openModal('edit', u)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        ✏️
                                                    </button>

                                                    {/* Ban/Unban Button */}
                                                    {u.is_active ? (
                                                        <button
                                                            className="btn-action btn-ban"
                                                            onClick={() => handleBanUser(u.id, u.username)}
                                                            disabled={isCurrentUser}
                                                            title={isCurrentUser ? 'Không thể khóa tài khoản của bạn' : 'Khóa tài khoản'}
                                                        >
                                                            🚫
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn-action btn-unban"
                                                            onClick={() => handleUnbanUser(u.id, u.username)}
                                                            title="Mở khóa tài khoản"
                                                        >
                                                            🔓
                                                        </button>
                                                    )}

                                                    <button
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDelete(u.id, u.username)}
                                                        disabled={isCurrentUser}
                                                        title={isCurrentUser ? 'Không thể xóa tài khoản của bạn' : 'Xóa'}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    {modalMode === 'add' && '➕ Thêm người dùng mới'}
                                    {modalMode === 'edit' && '✏️ Chỉnh sửa người dùng'}
                                    {modalMode === 'view' && '👁️ Chi tiết người dùng'}
                                </h2>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        {/* Username */}
                                        <div className="form-group">
                                            <label className="form-label">
                                                Tên đăng nhập <span className="required">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view' || modalMode === 'edit'}
                                                className={`form-input ${formErrors.username ? 'error' : ''}`}
                                                placeholder="Nhập tên đăng nhập"
                                            />
                                            {formErrors.username && (
                                                <span className="error-message">{formErrors.username}</span>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="form-group">
                                            <label className="form-label">
                                                Email <span className="required">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className={`form-input ${formErrors.email ? 'error' : ''}`}
                                                placeholder="Nhập email"
                                            />
                                            {formErrors.email && (
                                                <span className="error-message">{formErrors.email}</span>
                                            )}
                                        </div>

                                        {/* Full Name */}
                                        <div className="form-group">
                                            <label className="form-label">Họ và tên</label>
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className="form-input"
                                                placeholder="Nhập họ và tên"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div className="form-group">
                                            <label className="form-label">Số điện thoại</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className={`form-input ${formErrors.phone ? 'error' : ''}`}
                                                placeholder="Nhập số điện thoại"
                                            />
                                            {formErrors.phone && (
                                                <span className="error-message">{formErrors.phone}</span>
                                            )}
                                        </div>

                                        {/* Password */}
                                        <div className="form-group">
                                            <label className="form-label">
                                                Mật khẩu {modalMode === 'add' && <span className="required">*</span>}
                                                {modalMode === 'edit' && <span className="hint">(Để trống nếu không đổi)</span>}
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className={`form-input ${formErrors.password ? 'error' : ''}`}
                                                placeholder={modalMode === 'add' ? 'Nhập mật khẩu' : 'Nhập mật khẩu mới'}
                                            />
                                            {formErrors.password && (
                                                <span className="error-message">{formErrors.password}</span>
                                            )}
                                        </div>

                                        {/* Role */}
                                        <div className="form-group">
                                            <label className="form-label">
                                                Vai trò <span className="required">*</span>
                                            </label>
                                            <select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className="form-select"
                                            >
                                                {Object.entries(USER_ROLES).map(([role, info]) => (
                                                    <option key={role} value={role}>
                                                        {info.icon} {info.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Is Active */}
                                    <div className="form-group-checkbox">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className="checkbox-input"
                                            />
                                            <span>Tài khoản đang hoạt động</span>
                                        </label>
                                    </div>

                                    {/* View Mode: Additional Info */}
                                    {modalMode === 'view' && selectedUser && (
                                        <div className="view-info">
                                            <div className="info-row">
                                                <span className="info-label">ID:</span>
                                                <span className="info-value">#{selectedUser.id}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Ngày tạo:</span>
                                                <span className="info-value">{formatDateTime(selectedUser.created_at)}</span>
                                            </div>
                                            {selectedUser.updated_at && (
                                                <div className="info-row">
                                                    <span className="info-label">Cập nhật lần cuối:</span>
                                                    <span className="info-value">{formatDateTime(selectedUser.updated_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={closeModal}
                                    >
                                        {modalMode === 'view' ? 'Đóng' : 'Hủy'}
                                    </button>
                                    {modalMode !== 'view' && (
                                        <button
                                            type="submit"
                                            className="btn-submit"
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Đang xử lý...' : (modalMode === 'add' ? 'Thêm mới' : 'Cập nhật')}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagementPage;