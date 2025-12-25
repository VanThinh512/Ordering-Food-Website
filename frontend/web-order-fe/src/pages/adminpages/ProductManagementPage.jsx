import { useState, useEffect, useMemo } from 'react';

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

    const productStats = useMemo(() => {
        const available = products.filter((p) => p.is_available).length;
        const unavailable = products.length - available;
        return [
            {
                label: 'Tổng món ăn',
                value: products.length,
                meta: '+5 trong tuần qua',
                icon: '🍽️',
                accent: 'accent-cyan',
            },
            {
                label: 'Đang bán',
                value: available,
                meta: 'Hiện hữ trên menu',
                icon: '✅',
                accent: 'accent-green',
            },
            {
                label: 'Tạm dừng',
                value: unavailable,
                meta: 'Chờ bổ sung',
                icon: '⏸️',
                accent: 'accent-orange',
            },
            {
                label: 'Danh mục',
                value: categories.length,
                meta: 'Phân loại món',
                icon: '🗂️',
                accent: 'accent-purple',
            },
        ];
    }, [products, categories]);

    const categoryCountMap = useMemo(() => {
        return products.reduce((acc, product) => {
            const key = product.category_id;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }, [products]);

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
                <div className="product-admin-hero">
                    <div className="product-hero-copy">
                        <p className="dashboard-eyebrow">Điều phối thực đơn</p>
                        <h1>Quản lý món ăn theo phong cách bếp trưởng</h1>
                        <p>
                            Theo dõi tình trạng món ăn, tinh chỉnh giá và đồng bộ danh mục chỉ trong
                            một bảng điều khiển. Mọi cập nhật sẽ phản ánh ngay cho quầy và ứng dụng học sinh.
                        </p>
                        <div className="hero-actions">
                            <button className="btn-primary" onClick={openAddModal}>
                                + Thêm món mới
                            </button>
                            <button className="btn-secondary" onClick={loadData}>
                                Làm mới dữ liệu
                            </button>
                        </div>
                    </div>
                    <div className="product-hero-card">
                        <div>
                            <p className="card-label">Tỉ lệ sẵn sàng</p>
                            <h2>
                                {products.length
                                    ? Math.round(
                                          (products.filter((p) => p.is_available).length / products.length) * 100
                                      )
                                    : 0}
                                %
                            </h2>
                            <p className="card-meta">Món đang phục vụ</p>
                        </div>
                        <div className="hero-highlight-grid">
                            <div>
                                <span>Best-seller</span>
                                <strong>
                                    {products[0]?.name || 'Chưa có dữ liệu'}
                                </strong>
                            </div>
                            <div>
                                <span>Cập nhật gần nhất</span>
                                <strong>{new Date().toLocaleDateString('vi-VN')}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="product-stats-grid">
                    {productStats.map((stat) => (
                        <div key={stat.label} className={`product-stat-card ${stat.accent}`}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div>
                                <p>{stat.label}</p>
                                <h3>{stat.value}</h3>
                                <span>{stat.meta}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="product-filters-panel">
                    <div className="search-box elevated">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm món ăn..."
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

                    <div className="category-filters chip-group">
                        <button
                            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            Tất cả <span className="category-count">{products.length}</span>
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={`filter-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category.id.toString())}
                            >
                                {category.name}
                                <span className="category-count">
                                    {categoryCountMap[category.id] || 0}
                                </span>
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
                    <div className="products-table-container glass-panel">
                        <table className="products-table fancy-table">
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
                    <div
                        className="modal-overlay product-modal-overlay"
                        onClick={closeModal}
                    >
                        <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="product-modal-header">
                                <div>
                                    <p className="dashboard-eyebrow">
                                        {modalMode === 'add' ? 'Thêm món mới' : 'Chỉnh sửa món ăn'}
                                    </p>
                                    <h2>{modalMode === 'add' ? 'Đưa món mới lên quầy' : selectedProduct?.name}</h2>
                                    <span>Điền thông tin để đồng bộ ngay tới thực đơn học sinh.</span>
                                </div>
                                <button className="btn-close-circle" onClick={closeModal}>
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="product-modal-form">
                                <div className="product-modal-body">
                                    <div className="product-modal-fields">
                                        <div className="product-field-grid">
                                            <div className="form-group span-2">
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

                                            <div className="form-group span-2">
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

                                            <div className="form-group span-2">
                                                <label htmlFor="image_url">URL hình ảnh</label>
                                                <input
                                                    type="url"
                                                    id="image_url"
                                                    name="image_url"
                                                    value={formData.image_url}
                                                    onChange={handleInputChange}
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>

                                            <div className="form-group span-2 availability-toggle">
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
                                        </div>
                                    </div>
                                    <div className="product-preview-card">
                                        <p className="preview-label">Preview</p>
                                        <div className="preview-image">
                                            {formData.image_url ? (
                                                <img
                                                    src={formData.image_url}
                                                    alt="Preview"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            ) : (
                                                <span>🍱</span>
                                            )}
                                        </div>
                                        <h4>{formData.name || 'Tên món ăn'}</h4>
                                        <p>{formData.description || 'Mô tả món ăn sẽ hiển thị ở đây.'}</p>
                                        <div className="preview-meta">
                                            <span>{formData.price ? `${Number(formData.price).toLocaleString('vi-VN')}đ` : '0đ'}</span>
                                            <span>
                                                {formData.category_id
                                                    ? categories.find((c) => c.id === parseInt(formData.category_id))?.name
                                                    : 'Chưa có danh mục'}
                                            </span>
                                        </div>
                                        <div className={`preview-status ${formData.is_available ? 'available' : 'unavailable'}`}>
                                            {formData.is_available ? 'Đang bán' : 'Tạm dừng'}
                                        </div>
                                    </div>
                                </div>

                                <div className="product-modal-footer">
                                    <button type="button" className="btn-secondary" onClick={closeModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={submitting}>
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