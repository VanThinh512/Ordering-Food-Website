import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import productService from '../../services/Product';
import categoryService from '../../services/Category';

const ProductManagementPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_available: true
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Kiểm tra quyền admin
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
            const [productsData, categoriesData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll()
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchCategory = selectedCategory === 'all' || product.category_id === parseInt(selectedCategory);
        return matchSearch && matchCategory;
    });

    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            name: '',
            description: '',
            price: '',
            category_id: '',
            image_url: '',
            is_available: true
        });
        setFormErrors({});
        setSelectedProduct(null);
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            category_id: product.category_id.toString(),
            image_url: product.image_url || '',
            is_available: product.is_available
        });
        setFormErrors({});
        setSelectedProduct(product);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            category_id: '',
            image_url: '',
            is_available: true
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Tên món ăn không được để trống';
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            errors.price = 'Giá phải lớn hơn 0';
        }

        if (!formData.category_id) {
            errors.category_id = 'Vui lòng chọn danh mục';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error khi user nhập
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
            // Chuẩn bị dữ liệu - đảm bảo đúng kiểu dữ liệu
            const productData = {
                name: formData.name.trim(),
                description: formData.description.trim() || "", // Gửi string rỗng thay vì null
                price: parseFloat(formData.price),
                category_id: parseInt(formData.category_id),
                image_url: formData.image_url.trim() || "", // Gửi string rỗng thay vì null
                is_available: Boolean(formData.is_available)
            };

            console.log('📝 Form Data:', formData);
            console.log('📤 Submitting product data:', productData);
            console.log('🔍 Data types:', {
                name: typeof productData.name,
                description: typeof productData.description,
                price: typeof productData.price,
                category_id: typeof productData.category_id,
                image_url: typeof productData.image_url,
                is_available: typeof productData.is_available
            });

            if (modalMode === 'add') {
                console.log('➕ Creating new product...');
                const result = await productService.create(productData);
                console.log('✅ Product created successfully:', result);
                alert('Thêm món ăn thành công!');
            } else {
                console.log('✏️ Updating product ID:', selectedProduct.id);
                const result = await productService.update(selectedProduct.id, productData);
                console.log('✅ Product updated successfully:', result);
                alert('Cập nhật món ăn thành công!');
            }

            closeModal();
            loadData();
        } catch (error) {
            console.error('❌ Full error object:', error);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error response data:', error.response?.data);
            console.error('❌ Error response status:', error.response?.status);
            console.error('❌ Error response headers:', error.response?.headers);

            let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';

            if (error.response?.data?.detail) {
                // Nếu detail là array (validation errors)
                if (Array.isArray(error.response.data.detail)) {
                    const errors = error.response.data.detail
                        .map(err => `${err.loc?.join('.')}: ${err.msg}`)
                        .join('\n');
                    errorMessage = `Lỗi validation:\n${errors}`;
                } else {
                    errorMessage = error.response.data.detail;
                }
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
                navigate('/login');
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

    const handleDelete = async (productId, productName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa món "${productName}"?`)) {
            return;
        }

        try {
            await productService.delete(productId);
            alert('Xóa món ăn thành công!');
            loadData();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(error.response?.data?.detail || 'Không thể xóa món ăn này');
        }
    };

    const toggleAvailability = async (product) => {
        try {
            await productService.update(product.id, {
                ...product,
                is_available: !product.is_available
            });
            loadData();
        } catch (error) {
            console.error('Error toggling availability:', error);
            alert('Không thể cập nhật trạng thái món ăn');
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
        <div className="product-management-page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <span className="title-icon">🍽️</span>
                            Quản lý món ăn
                        </h1>
                        <p className="page-subtitle">
                            Quản lý thực đơn và cập nhật món ăn
                        </p>
                    </div>
                    <button className="btn-add-product" onClick={openAddModal}>
                        <span className="btn-icon">+</span>
                        Thêm món mới
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <span className="stat-label">Tổng món ăn</span>
                            <strong className="stat-value">{products.length}</strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <span className="stat-label">Đang bán</span>
                            <strong className="stat-value">
                                {products.filter(p => p.is_available).length}
                            </strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">❌</div>
                        <div className="stat-content">
                            <span className="stat-label">Hết hàng</span>
                            <strong className="stat-value">
                                {products.filter(p => !p.is_available).length}
                            </strong>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📂</div>
                        <div className="stat-content">
                            <span className="stat-label">Danh mục</span>
                            <strong className="stat-value">{categories.length}</strong>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm món ăn..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="category-filters">
                        <button
                            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            Tất cả
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={`filter-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category.id.toString())}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Table */}
                {filteredProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🍽️</div>
                        <h2>Không tìm thấy món ăn</h2>
                        <p>Thử tìm kiếm với từ khóa khác hoặc thêm món mới</p>
                        <button className="btn-primary" onClick={openAddModal}>
                            Thêm món mới
                        </button>
                    </div>
                ) : (
                    <div className="products-table-container">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Hình ảnh</th>
                                    <th>Tên món</th>
                                    <th>Danh mục</th>
                                    <th>Giá</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(product => {
                                    const category = categories.find(c => c.id === product.category_id);
                                    return (
                                        <tr key={product.id}>
                                            <td>
                                                <div className="product-image-cell">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="product-thumbnail"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="no-image-placeholder" style={{ display: product.image_url ? 'none' : 'flex' }}>
                                                        🍽️
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="product-info-cell">
                                                    <strong className="product-name">{product.name}</strong>
                                                    {product.description && (
                                                        <p className="product-description">{product.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="category-badge">
                                                    {category?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <strong className="product-price">
                                                    {product.price.toLocaleString('vi-VN')}đ
                                                </strong>
                                            </td>
                                            <td>
                                                <button
                                                    className={`status-toggle ${product.is_available ? 'available' : 'unavailable'}`}
                                                    onClick={() => toggleAvailability(product)}
                                                    title="Click để thay đổi trạng thái"
                                                >
                                                    {product.is_available ? (
                                                        <>
                                                            <span className="status-dot"></span>
                                                            Đang bán
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="status-dot"></span>
                                                            Hết hàng
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-action btn-edit"
                                                        onClick={() => openEditModal(product)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDelete(product.id, product.name)}
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
                                    {modalMode === 'add' ? '➕ Thêm món mới' : '✏️ Chỉnh sửa món ăn'}
                                </h2>
                                <button className="modal-close" onClick={closeModal}>✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-group">
                                    <label htmlFor="name">
                                        Tên món ăn <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={formErrors.name ? 'error' : ''}
                                        placeholder="Nhập tên món ăn"
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
                                        rows="3"
                                        placeholder="Nhập mô tả món ăn"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="price">
                                            Giá <span className="required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            id="price"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className={formErrors.price ? 'error' : ''}
                                            placeholder="0"
                                            min="0"
                                            step="1000"
                                        />
                                        {formErrors.price && <span className="error-message">{formErrors.price}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="category_id">
                                            Danh mục <span className="required">*</span>
                                        </label>
                                        <select
                                            id="category_id"
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            className={formErrors.category_id ? 'error' : ''}
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.category_id && <span className="error-message">{formErrors.category_id}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="image_url">URL hình ảnh</label>
                                    <input
                                        type="url"
                                        id="image_url"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {formData.image_url && (
                                        <div className="image-preview">
                                            <img src={formData.image_url} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="is_available"
                                            checked={formData.is_available}
                                            onChange={handleInputChange}
                                        />
                                        <span>Món ăn đang có sẵn để bán</span>
                                    </label>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-submit" disabled={submitting}>
                                        {submitting ? 'Đang xử lý...' : modalMode === 'add' ? 'Thêm món' : 'Cập nhật'}
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

export default ProductManagementPage;