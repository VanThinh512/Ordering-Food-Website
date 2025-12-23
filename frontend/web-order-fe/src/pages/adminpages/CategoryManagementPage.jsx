import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import categoryService from '../../services/Category';
import productService from '../../services/Product';


const CategoryManagementPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

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

        loadData();
    }, [isAuthenticated, user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [categoriesData, productsData] = await Promise.all([
                categoryService.getAll(),
                productService.getAll()
            ]);
            setCategories(categoriesData);
            setProducts(productsData);
            console.log('✅ Loaded data:', { categoriesData, productsData });
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getCategoryProductCount = (categoryId) => {
        return products.filter(p => p.category_id === categoryId).length;
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            name: '',
            description: ''
        });
        setFormErrors({});
        setSelectedCategory(null);
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setModalMode('edit');
        setFormData({
            name: category.name,
            description: category.description || ''
        });
        setFormErrors({});
        setSelectedCategory(category);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCategory(null);
        setFormData({
            name: '',
            description: ''
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Tên danh mục không được để trống';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const categoryData = {
                name: formData.name.trim(),
                description: formData.description.trim() || null
            };

            console.log('📝 Submitting category data:', categoryData);

            if (modalMode === 'add') {
                console.log('➕ Creating new category...');
                await categoryService.create(categoryData);
                alert('Thêm danh mục thành công!');
            } else {
                console.log('✏️ Updating category:', selectedCategory.id);
                await categoryService.update(selectedCategory.id, categoryData);
                alert('Cập nhật danh mục thành công!');
            }

            closeModal();
            loadData();
        } catch (error) {
            console.error('❌ Error submitting category:', error);

            let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';

            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (categoryId, categoryName) => {
        const productCount = getCategoryProductCount(categoryId);

        if (productCount > 0) {
            if (!window.confirm(`Danh mục "${categoryName}" có ${productCount} món ăn. Bạn có chắc muốn xóa?\n\nCác món ăn sẽ bị ảnh hưởng.`)) {
                return;
            }
        } else {
            if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?`)) {
                return;
            }
        }

        try {
            console.log('🗑️ Deleting category:', categoryId);
            await categoryService.delete(categoryId);
            alert('Xóa danh mục thành công!');
            loadData();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert(error.response?.data?.detail || 'Không thể xóa danh mục này.');
        }
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
        <div className="category-management-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <span className="title-icon">📂</span>
                            Quản lý danh mục
                        </h1>
                        <p className="page-subtitle">
                            Quản lý các danh mục món ăn trong hệ thống
                        </p>
                    </div>
                    <button className="btn-add-category" onClick={openAddModal}>
                        <span className="btn-icon">+</span>
                        Thêm danh mục mới
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <span className="stat-label">Tổng danh mục</span>
                            <strong className="stat-value">{categories.length}</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🍽️</div>
                        <div className="stat-content">
                            <span className="stat-label">Tổng món ăn</span>
                            <strong className="stat-value">{products.length}</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📝</div>
                        <div className="stat-content">
                            <span className="stat-label">Có mô tả</span>
                            <strong className="stat-value">
                                {categories.filter(c => c.description).length}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="search-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                {/* Categories Table */}
                {filteredCategories.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h2>Không tìm thấy danh mục</h2>
                        <p>Thử tìm kiếm với từ khóa khác hoặc thêm danh mục mới</p>
                        <button className="btn-primary" onClick={openAddModal}>
                            Thêm danh mục mới
                        </button>
                    </div>
                ) : (
                    <div className="categories-table-container">
                        <table className="categories-table">
                            <thead>
                                <tr>
                                    <th>Icon</th>
                                    <th>Tên danh mục</th>
                                    <th>Mô tả</th>
                                    <th>Số món ăn</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.map((category) => {
                                    const productCount = getCategoryProductCount(category.id);
                                    return (
                                        <tr key={category.id}>
                                            <td>
                                                <div className="category-icon-cell">
                                                    📁
                                                </div>
                                            </td>
                                            <td>
                                                <div className="category-info-cell">
                                                    <strong className="category-name">{category.name}</strong>
                                                    <span className="category-id-text">ID: {category.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="category-description-text">
                                                    {category.description || <em style={{ color: 'rgba(226, 232, 240, 0.5)' }}>Chưa có mô tả</em>}
                                                </p>
                                            </td>
                                            <td>
                                                <div className="product-count-badge">
                                                    <span className="count-icon">🍽️</span>
                                                    <strong>{productCount} món</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-action btn-view"
                                                        onClick={() => navigate(`/admin/products?category=${category.id}`)}
                                                        title="Xem món ăn"
                                                    >
                                                        👁️
                                                    </button>
                                                    <button
                                                        className="btn-action btn-edit"
                                                        onClick={() => openEditModal(category)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDelete(category.id, category.name)}
                                                        title="Xóa"
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
                                    {modalMode === 'add' ? '➕ Thêm danh mục mới' : '✏️ Chỉnh sửa danh mục'}
                                </h2>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label htmlFor="name">
                                        Tên danh mục <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={formErrors.name ? 'error' : ''}
                                        placeholder="Nhập tên danh mục (VD: Món chính, Đồ uống...)"
                                    />
                                    {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Mô tả</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="4"
                                        placeholder="Nhập mô tả cho danh mục (tùy chọn)"
                                    />
                                    <small className="form-hint">
                                        Mô tả ngắn gọn về loại món ăn trong danh mục này
                                    </small>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-submit" disabled={submitting}>
                                        {submitting ? 'Đang xử lý...' : modalMode === 'add' ? 'Thêm danh mục' : 'Cập nhật'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManagementPage;