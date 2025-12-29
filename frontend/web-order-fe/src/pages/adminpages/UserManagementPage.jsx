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
            const data = await userService.getAll();
            setUsers(data);
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
        if (selectedRole !== 'all' && u.role !== selectedRole) {
            return false;
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            return (
                (u.username || '').toLowerCase().includes(term) ||
                (u.email || '').toLowerCase().includes(term) ||
                (u.full_name || '').toLowerCase().includes(term) ||
                (u.phone || '').toLowerCase().includes(term)
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
        } else if ((mode === 'edit' || mode === 'view') && userData) {
            // FIX: Sử dụng || '' để tránh lỗi controlled component khi dữ liệu null
            setFormData({
                username: userData.username || '', 
                email: userData.email || '',
                full_name: userData.full_name || '',
                phone: userData.phone || '',
                password: '',
                role: userData.role || 'customer',
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

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        // Nếu mode là Edit và username trống (do user cũ không có), bắt buộc nhập lại
        if (!formData.username.trim()) {
            errors.username = 'Tên đăng nhập không được để trống';
        } else if (formData.username.length < 3) {
            errors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email không hợp lệ';
        }

        if (modalMode === 'add') {
            if (!formData.password) {
                errors.password = 'Mật khẩu không được để trống';
            } else if (formData.password.length < 6) {
                errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            }
        } else if (modalMode === 'edit' && formData.password && formData.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
            errors.phone = 'Số điện thoại không hợp lệ';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

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

            if (formData.password) {
                userData.password = formData.password;
            }

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
            let errorMessage = 'Có lỗi xảy ra.';
            if (error.response?.data?.detail) {
                errorMessage = Array.isArray(error.response.data.detail)
                    ? error.response.data.detail.map(e => e.msg).join('\n')
                    : error.response.data.detail;
            }
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // FIX: Sửa lại hàm delete để xử lý trường hợp không có username
    const handleDelete = async (userId, username, email) => {
        // Nếu không có username thì hiển thị email, hoặc ID
        const displayName = username || email || `ID: ${userId}`;
        
        if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${displayName}"?\n⚠️ CẢNH BÁO: Hành động này không thể hoàn tác.`)) {
            return;
        }

        if (userId === user.id) {
            alert('❌ Bạn không thể xóa tài khoản của chính mình!');
            return;
        }

        try {
            console.log('🗑️ Deleting user ID:', userId);
            await userService.delete(userId);
            alert('✅ Xóa người dùng thành công!');
            await loadUsers();
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            const backendError = error.response?.data?.detail;
            
            // Gợi ý lỗi phổ biến do Foreign Key
            if (!backendError || backendError === 'Không thể xóa người dùng') {
                alert(`❌ Không thể xóa người dùng "${displayName}".\n\n💡 Nguyên nhân có thể: Người dùng này đã có Đơn hàng hoặc dữ liệu liên quan trong hệ thống.\n\n👉 Giải pháp: Hãy dùng chức năng "Khóa tài khoản" (Ban) thay vì xóa.`);
            } else {
                alert(`❌ Lỗi: ${backendError}`);
            }
        }
    };

    const handleBanUser = async (userId, username) => {
        const displayName = username || `ID: ${userId}`;
        if (userId === user.id) return alert('❌ Không thể khóa chính mình!');

        const reason = window.prompt(`Khóa tài khoản "${displayName}"?\nNhập lý do:`);
        if (reason === null) return;
        if (!reason.trim()) return alert('❌ Cần nhập lý do!');

        try {
            await userService.banUser(userId);
            alert(`✅ Đã khóa tài khoản "${displayName}"!`);
            await loadUsers();
        } catch (error) {
            alert(error.response?.data?.detail || 'Lỗi khóa tài khoản');
        }
    };

    const handleUnbanUser = async (userId, username) => {
         const displayName = username || `ID: ${userId}`;
        if (!window.confirm(`Mở khóa tài khoản "${displayName}"?`)) return;

        try {
            await userService.unbanUser(userId);
            alert(`✅ Đã mở khóa "${displayName}"!`);
            await loadUsers();
        } catch (error) {
            alert(error.response?.data?.detail || 'Lỗi mở khóa');
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div><p>Đang tải...</p></div>;

    return (
        <div className="user-management-page">
            <div className="container">
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title"><span className="title-icon">👥</span> Quản lý người dùng</h1>
                    </div>
                </div>

                {/* Stats Cards - Giữ nguyên như cũ */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <span className="stat-label">Tổng người dùng</span>
                            <strong className="stat-value">{users.length}</strong>
                        </div>
                    </div>
                    {['admin', 'staff', 'customer'].map(role => (
                        <div key={role} className={`stat-card stat-${role}`}>
                            <div className="stat-icon">{USER_ROLES[role].icon}</div>
                            <div className="stat-content">
                                <span className="stat-label">{USER_ROLES[role].label}</span>
                                <strong className="stat-value">{getRoleCount(role)}</strong>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, sđt..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>}
                    </div>

                    <div className="role-filter">
                        <button className={`role-filter-btn ${selectedRole === 'all' ? 'active' : ''}`} onClick={() => setSelectedRole('all')}>
                            Tất cả ({getRoleCount('all')})
                        </button>
                        {Object.entries(USER_ROLES).map(([role, info]) => (
                            <button
                                key={role}
                                className={`role-filter-btn ${selectedRole === role ? 'active' : ''}`}
                                onClick={() => setSelectedRole(role)}
                                style={{ '--role-color': info.color, borderColor: selectedRole === role ? info.color : 'transparent' }}
                            >
                                {info.icon} {info.label} ({getRoleCount(role)})
                            </button>
                        ))}
                    </div>
                    {/* Nút Thêm Mới */}
                    <button className="btn-add-user" onClick={() => openModal('add')} style={{marginLeft: 'auto', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <span>➕</span> Thêm mới
                    </button>
                </div>

                {/* Table */}
                {filteredUsers.length === 0 ? (
                    <div className="empty-state"><p>Không tìm thấy người dùng nào.</p></div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên đăng nhập</th>
                                    <th>Họ tên</th>
                                    <th>Email</th>
                                    <th>SĐT</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => {
                                    const roleInfo = USER_ROLES[u.role] || USER_ROLES.customer;
                                    const isCurrentUser = u.id === user.id;

                                    return (
                                        <tr key={u.id} className={isCurrentUser ? 'current-user' : ''}>
                                            <td><strong className="user-id">#{u.id}</strong></td>
                                            <td>
                                                <div className="username-cell">
                                                    {u.username ? <strong>{u.username}</strong> : <span style={{color:'#999', fontStyle:'italic'}}>(Trống)</span>}
                                                    {isCurrentUser && <span className="current-badge">Bạn</span>}
                                                </div>
                                            </td>
                                            <td>{u.full_name || '-'}</td>
                                            <td><a href={`mailto:${u.email}`} className="email-link">{u.email}</a></td>
                                            <td>{u.phone || '-'}</td>
                                            <td>
                                                <span className="role-badge" style={{ background: roleInfo.color + '20', color: roleInfo.color, borderColor: roleInfo.color }}>
                                                    {roleInfo.icon} {roleInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                                    {u.is_active ? '✓ Hoạt động' : '🚫 Bị khóa'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-action btn-edit" onClick={() => openModal('edit', u)} title="Sửa">✏️</button>
                                                    {u.is_active ? (
                                                        <button className="btn-action btn-ban" onClick={() => handleBanUser(u.id, u.username)} disabled={isCurrentUser} title="Khóa">🚫</button>
                                                    ) : (
                                                        <button className="btn-action btn-unban" onClick={() => handleUnbanUser(u.id, u.username)} title="Mở khóa">🔓</button>
                                                    )}
                                                    {/* FIX: Truyền thêm u.email vào để fallback nếu username null */}
                                                    <button className="btn-action btn-delete" onClick={() => handleDelete(u.id, u.username, u.email)} disabled={isCurrentUser} title="Xóa">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal Form - Giữ nguyên logic render nhưng state đã được fix ở openModal */}
                {showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">{modalMode === 'add' ? '➕ Thêm' : modalMode === 'edit' ? '✏️ Sửa' : 'Chi tiết'}</h2>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Tên đăng nhập <span className="required">*</span></label>
                                            <input 
                                                type="text" name="username" 
                                                value={formData.username} onChange={handleInputChange} 
                                                className={`form-input ${formErrors.username ? 'error' : ''}`}
                                                disabled={modalMode === 'view'} // Cho phép sửa username nếu muốn
                                            />
                                            {formErrors.username && <span className="error-message">{formErrors.username}</span>}
                                        </div>
                                        {/* Các trường khác giữ nguyên */}
                                        <div className="form-group">
                                            <label className="form-label">Email <span className="required">*</span></label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`form-input ${formErrors.email ? 'error' : ''}`} disabled={modalMode === 'view'} />
                                            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Họ tên</label>
                                            <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="form-input" disabled={modalMode === 'view'} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Số điện thoại</label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" disabled={modalMode === 'view'} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Mật khẩu {modalMode==='add' && '*'}</label>
                                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={`form-input ${formErrors.password ? 'error' : ''}`} placeholder={modalMode==='edit' ? 'Để trống nếu không đổi' : ''} disabled={modalMode === 'view'} />
                                            {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Vai trò</label>
                                            <select name="role" value={formData.role} onChange={handleInputChange} className="form-select" disabled={modalMode === 'view'}>
                                                {Object.entries(USER_ROLES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group-checkbox">
                                        <label className="checkbox-label">
                                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} disabled={modalMode === 'view'} />
                                            <span>Đang hoạt động</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeModal}>Hủy</button>
                                    {modalMode !== 'view' && <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? 'Lưu...' : 'Lưu lại'}</button>}
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