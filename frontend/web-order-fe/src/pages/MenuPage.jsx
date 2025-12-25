import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import productService from '../services/Product';
import categoryService from '../services/Category';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useTableStore } from '../stores/tableStore';
import { formatPrice } from '../utils/helpers';

const MenuPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // Lưu tất cả sản phẩm
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [addingProductId, setAddingProductId] = useState(null);

    const addToCart = useCartStore((state) => state.addToCart);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { selectedTable, getSelectedTable } = useTableStore();

    useEffect(() => {
        // Kiểm tra authentication
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Kiểm tra đã chọn bàn chưa
        const table = getSelectedTable();
        console.log('📍 Current selected table:', table);

        // Load dữ liệu ban đầu
        loadInitialData();
    }, [isAuthenticated]);

    // Filter products khi thay đổi category hoặc search
    useEffect(() => {
        filterProducts();
    }, [selectedCategory, searchTerm, allProducts]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [categoriesData, productsData] = await Promise.all([
                categoryService.getAll(),
                productService.getAll()
            ]);

            setCategories(categoriesData);
            setAllProducts(productsData);
            console.log('✅ Loaded initial data:', {
                categories: categoriesData.length,
                products: productsData.length
            });
        } catch (error) {
            console.error('Error loading initial data:', error);
            alert('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = [...allProducts];

        // Lọc theo category
        if (selectedCategory && selectedCategory !== 'all') {
            filtered = filtered.filter(product =>
                product.category_id === parseInt(selectedCategory)
            );
            console.log(`🔍 Filtered by category ${selectedCategory}:`, filtered.length);
        }

        // Lọc theo search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(term) ||
                (product.description && product.description.toLowerCase().includes(term))
            );
            console.log(`🔍 Filtered by search "${searchTerm}":`, filtered.length);
        }

        setProducts(filtered);
    };

    const handleCategoryChange = (categoryId) => {
        console.log('📂 Category changed to:', categoryId);
        setSelectedCategory(categoryId);

        // Cập nhật URL params
        if (categoryId === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', categoryId);
        }
        setSearchParams(searchParams);
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        console.log('🔍 Search term:', value);
        setSearchTerm(value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleAddToCart = async (product) => {
        // Kiểm tra đăng nhập
        if (!isAuthenticated) {
            alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
            navigate('/login');
            return;
        }

        // Kiểm tra đã chọn bàn chưa
        const table = getSelectedTable();
        if (!table) {
            alert('⚠️ Vui lòng chọn bàn trước khi đặt món!');
            navigate('/tables');
            return;
        }

        try {
            setAddingProductId(product.id);
            console.log('🛒 Adding product to cart:', {
                product: product.name,
                table: `Bàn ${table.number}`,
                price: product.price
            });

            // Gọi addToCart với đầy đủ thông tin
            await addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: 1,
                tableId: table.id,
                tableName: `Bàn ${table.number}`
            });

            // Hiển thị thông báo thành công
            showToast(`✅ Đã thêm ${product.name} vào giỏ hàng`);
        } catch (error) {
            console.error('❌ Failed to add to cart:', error);
            alert(error.message || 'Không thể thêm vào giỏ hàng');
        } finally {
            setAddingProductId(null);
        }
    };

    const showToast = (message) => {
        // Tạo toast notification đơn giản
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInUp 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    // Render table banner nếu đã chọn bàn
    const renderTableBanner = () => {
        if (!selectedTable) {
            return (
                <div className="table-alert-banner warning glass-panel">
                    <div className="banner-copy">
                        <span className="banner-icon">⚠️</span>
                        <div>
                            <p className="banner-eyebrow">Chưa có bàn</p>
                            <h3>Hãy chọn bàn trước khi đặt món</h3>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/tables')}>
                        Chọn bàn ngay
                    </button>
                </div>
            );
        }

        return (
            <div className="table-alert-banner success glass-panel">
                <div className="banner-copy">
                    <span className="banner-icon">🪑</span>
                    <div>
                        <p className="banner-eyebrow">Bàn đã chọn</p>
                        <h3>
                            Bàn {selectedTable.table_number || selectedTable.number} - {selectedTable.location}
                        </h3>
                    </div>
                </div>
                <button className="btn-secondary" onClick={() => navigate('/tables')}>
                    Đổi bàn
                </button>
            </div>
        );
    };

    // Đếm số sản phẩm theo category
    const getCategoryCount = (categoryId) => {
        if (categoryId === 'all') return allProducts.length;
        return allProducts.filter(p => p.category_id === categoryId).length;
    };

    return (
        <div className="menu-page">
            <div className="container menu-container">
                <div className="menu-layout-grid">
                    <div className="menu-main-column">
                        {renderTableBanner()}

                        <section className="menu-hero glass-panel">
                            <div className="menu-hero-copy">
                                <p className="dashboard-eyebrow">Thực đơn hôm nay</p>
                                <h1>Ăn ngon - no lâu - nạp năng lượng</h1>
                                <p>
                                    Từ món chính đến đồ uống, mọi món ăn đều được chuẩn bị tươi mới mỗi ngày. Chọn món, đặt bàn và
                                    thưởng thức ngay tại căn-tin số hóa.
                                </p>
                                <div className="hero-actions">
                                    <button className="btn-primary" onClick={() => setSelectedCategory('all')}>

                                        Xem tất cả món
                                    </button>
                                    <button className="btn-secondary" onClick={() => navigate('/orders')}>

                                        Đơn hàng của tôi
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                    <aside className="menu-side-panel">
                        <div className="menu-hero-card glass-panel">
                            <div className="hero-card-metric">
                                <span>Đang mở bán </span>
                                <strong>{products.length || allProducts.length} món</strong>
                            </div>
                            <div className="hero-card-status">
                                <p>Hôm nay có {categories.length} nhóm món.</p>
                                <p>
                                    Bàn{' '}
                                    {selectedTable
                                        ? selectedTable.table_number || selectedTable.number
                                        : 'chưa chọn'}
                                    .
                                </p>
                            </div>
                        </div>
                        <div className="menu-stats-card glass-panel">
                            <p>Đã thêm vào giỏ</p>
                            <strong>{addingProductId ? 'Đang thêm...' : 'Sẵn sàng'}</strong>
                        </div>
                    </aside>
                </div>

                <div className="menu-header">
                    <span className="menu-kicker">Thực đơn hôm nay</span>
                    <h1 className="page-title">Thực đơn</h1>
                    <p className="menu-description">
                        Chọn món yêu thích của bạn và đặt ngay để giữ trọn năng lượng cho ngày dài.
                    </p>
                </div>

                <div className="menu-controls">
                    <div className="menu-search">
                        <span className="search-icon" aria-hidden="true">
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm món ăn..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search-btn"
                                onClick={handleClearSearch}
                                title="Xóa tìm kiếm"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="category-filter">
                        <button
                            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('all')}
                        >
                            Tất cả
                            <span className="category-count">({getCategoryCount('all')})</span>
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(category.id.toString())}
                            >
                                {category.name}
                                <span className="category-count">({getCategoryCount(category.id)})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {(searchTerm || selectedCategory !== 'all') && (
                    <div className="filter-info glass-panel">
                        <div className="filter-text">
                            {searchTerm && (
                                <span className="filter-chip">
                                    Từ khóa: <strong>"{searchTerm}"</strong>
                                </span>
                            )}
                            {selectedCategory !== 'all' && (
                                <span className="filter-chip">
                                    Danh mục:{' '}
                                    <strong>
                                        {categories.find(c => c.id.toString() === selectedCategory)?.name}
                                    </strong>
                                </span>
                            )}
                        </div>
                        <div className="filter-meta">
                            <span className="result-count">
                                <strong>{products.length}</strong> món ăn
                            </span>
                            <button
                                type="button"
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    searchParams.delete('category');
                                    setSearchParams(searchParams);
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="menu-products-panel">
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Đang tải...</p>
                        </div>
                    </div>
                ) : (
                    <div className="menu-products-panel">
                        {products.length === 0 ? (
                            <div className="no-products">
                                <div className="no-products-icon">🔍</div>
                                <h3>Không tìm thấy món ăn nào</h3>
                                <p>
                                    {searchTerm
                                        ? `Không có món ăn nào phù hợp với "${searchTerm}"`
                                        : 'Danh mục này chưa có món ăn'
                                    }
                                </p>
                                <button
                                    className="btn-reset-filter"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        searchParams.delete('category');
                                        setSearchParams(searchParams);
                                    }}
                                >
                                    Xem tất cả món ăn
                                </button>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {products.map((product) => (
                                    <div key={product.id} className="product-card">
                                        <div className="product-image">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} />
                                            ) : (
                                                <div className="no-image">🍽️</div>
                                            )}
                                            {!product.is_available && (
                                                <div className="out-of-stock">Hết hàng</div>
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <h3 className="product-name">{product.name}</h3>
                                            <p className="product-description">{product.description}</p>
                                            <div className="product-footer">
                                                <span className="product-price">{formatPrice(product.price)}</span>
                                                <button
                                                    className="btn-add-to-cart"
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={!product.is_available || addingProductId === product.id}
                                                >
                                                    {addingProductId === product.id ? (
                                                        'Đang thêm...'
                                                    ) : product.is_available ? (
                                                        'Thêm vào giỏ'
                                                    ) : (
                                                        'Hết hàng'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;