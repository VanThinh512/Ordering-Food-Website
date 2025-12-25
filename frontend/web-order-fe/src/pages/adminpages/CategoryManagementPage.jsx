import { useState, useEffect, useMemo } from 'react';

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
            console.log('Loaded data:', { categoriesData, productsData });
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = useMemo(() => (
        categories.filter(category =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    ), [categories, searchTerm]);

    const categoryCountMap = useMemo(() => (
        products.reduce((acc, product) => {
            acc[product.category_id] = (acc[product.category_id] || 0) + 1;
            return acc;
        }, {})
    ), [products]);

    const describedCount = useMemo(
        () => categories.filter(c => c.description?.trim()).length,
        [categories]
    );

    const busiestCategory = useMemo(() => {
        let topCategory = null;
        let maxCount = 0;
        categories.forEach((category) => {
            const count = categoryCountMap[category.id] || 0;
            if (count > maxCount) {
                maxCount = count;
                topCategory = category;
            }
        });
        return topCategory ? { ...topCategory, productCount: maxCount } : null;
    }, [categories, categoryCountMap]);

    const categoryStats = useMemo(() => {
        const averageProducts = categories.length ? Math.round(products.length / categories.length) : 0;
        return [
            {
                label: 'Tổng danh mục',
                value: categories.length,
                meta: '+2 trong tuần này',
                icon: '',
                accent: 'accent-cyan',
            },
            {
                label: 'Món ăn được gắn',
                value: products.length,
                meta: 'Trên toàn bộ hệ thống',
                icon: '',
                accent: 'accent-orange',
            },
            {
                label: 'Có mô tả',
                value: describedCount,
                meta: 'Giúp học sinh hiểu menu',
                icon: '',
                accent: 'accent-purple',
            },
            {
                label: 'TB món/danh mục',
                value: averageProducts,
                meta: 'Cân bằng thực đơn',
                icon: '',
                accent: 'accent-green',
            },
        ];
    }, [categories, products, describedCount]);

    const getCategoryProductCount = (categoryId) => categoryCountMap[categoryId] || 0;

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

            console.log('Submitting category data:', categoryData);

            if (modalMode === 'add') {
                console.log('Creating new category...');
                await categoryService.create(categoryData);
                alert('Thêm danh mục thành công!');
            } else {
                console.log('Updating category:', selectedCategory.id);
                await categoryService.update(selectedCategory.id, categoryData);
                alert('Cập nhật danh mục thành công!');
            }

            closeModal();
            loadData();
        } catch (error) {
            console.error('Error submitting category:', error);

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
            console.log('Deleting category:', categoryId);
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
                <div className="category-admin-hero glass-panel">
                    <div className="category-hero-copy">
                        <p className="dashboard-eyebrow">Điều phối thực đơn</p>
                        <h1>Danh mục tinh gọn, menu dễ hiểu</h1>
                        <p>
                            Gom nhóm món ăn theo phong cách trực quan để học sinh duyệt nhanh chóng.
                            Cập nhật danh mục sẽ đồng bộ ngay lên app và quầy bán.
                        </p>
                        <div className="hero-actions">
                            <button className="btn-primary" onClick={openAddModal}>
                                + Thêm danh mục
                            </button>
                            <button className="btn-secondary" onClick={loadData}>
                                Làm mới dữ liệu
                            </button>
                        </div>
                    </div>
                    <div className="category-hero-card">
                        <div>
                            <p className="card-label">Danh mục nổi bật</p>
                            <h2>{busiestCategory?.name || 'Chưa có dữ liệu'}</h2>
                            <p className="card-meta">
                                {busiestCategory ? `${busiestCategory.productCount} món đang được gắn` : 'Hãy thêm món vào danh mục để theo dõi'}
                            </p>
                        </div>
                        <div className="category-hero-insights">
                            <div>
                                <span>Danh mục tổng</span>
                                <strong>{categories.length}</strong>
                            </div>
                            <div>
                                <span>Mô tả đã viết</span>
                                <strong>{describedCount}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="category-stats-grid">
                    {categoryStats.map((stat) => (
                        <div key={stat.label} className={`category-stat-card ${stat.accent}`}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div>
                                <p>{stat.label}</p>
                                <h3>{stat.value}</h3>
                                <span>{stat.meta}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="category-toolbar">
                    <div className="search-box elevated">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button className="filter-clear" onClick={() => setSearchTerm('')}>
                                ×
                            </button>
                        )}
                    </div>
                    <button className="btn-primary" onClick={openAddModal}>
                        + Danh mục mới
                    </button>
                </div>

                {filteredCategories.length === 0 ? (
                    <div className="empty-state glass-panel">
                        <div className="empty-icon">📂</div>
                        <h2>Không tìm thấy danh mục</h2>
                        <p>Thử tìm kiếm với từ khóa khác hoặc thêm danh mục mới</p>
                        <button className="btn-primary" onClick={openAddModal}>
                            Thêm danh mục mới
                        </button>
                    </div>
                ) : (
                    <div className="category-grid">
                        {filteredCategories.map((category) => {
                            const productCount = getCategoryProductCount(category.id);
                            return (
                                <div key={category.id} className="category-card">
                                    <div className="category-card-header">
                                        <div className="category-icon">📁</div>
                                        <div>
                                            <p className="card-label">Danh mục #{category.id}</p>
                                            <h3>{category.name}</h3>
                                        </div>
                                    </div>
                                    <p className="category-card-description">
                                        {category.description || 'Chưa có mô tả. Hãy bổ sung để học sinh hiểu rõ hơn.'}
                                    </p>
                                    <div className="category-card-meta">
                                        <div className="category-count-pill">
                                            <span>🍽️</span>
                                            <strong>{productCount} món</strong>
                                        </div>
                                        <button
                                            className="link-button"
                                            onClick={() => navigate(`/admin/products?category=${category.id}`)}
                                        >
                                            Xem món
                                        </button>
                                    </div>
                                    <div className="category-card-actions">
                                        <button className="btn-secondary ghost" onClick={() => openEditModal(category)}>
                                            ✏️ Chỉnh sửa
                                        </button>
                                        <button className="btn-danger ghost" onClick={() => handleDelete(category.id, category.name)}>
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay category-modal-overlay" onClick={closeModal}>
                        <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="category-modal-header">
                                <div>
                                    <p className="dashboard-eyebrow">
                                        {modalMode === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                                    </p>
                                    <h2>{modalMode === 'add' ? 'Tạo nhóm món ăn mới' : selectedCategory?.name}</h2>
                                    <span>Đặt tên và mô tả ngắn để menu rõ ràng hơn.</span>
                                </div>
                                <button className="btn-close-circle" onClick={closeModal}>
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="category-modal-form">
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

                                <div className="category-modal-footer">
                                    <button type="button" className="btn-secondary" onClick={closeModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={submitting}>
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