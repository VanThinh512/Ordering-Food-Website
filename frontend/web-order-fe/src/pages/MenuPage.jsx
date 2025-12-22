import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/Product';
import categoryService from '../services/Category';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { formatPrice } from '../utils/helpers';

const MenuPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [searchTerm, setSearchTerm] = useState('');

    const addToCart = useCartStore((state) => state.addToCart);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, searchTerm]);

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let data;
            if (selectedCategory && selectedCategory !== 'all') {
                data = await productService.getByCategory(selectedCategory);
            } else {
                data = await productService.getAll({ search: searchTerm });
            }
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        if (categoryId === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', categoryId);
        }
        setSearchParams(searchParams);
    };

    const handleAddToCart = async (productId) => {
        if (!isAuthenticated) {
            alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
            return;
        }

        const result = await addToCart(productId, 1);
        if (result.success) {
            alert('Đã thêm vào giỏ hàng');
        } else {
            alert(result.error || 'Không thể thêm vào giỏ hàng');
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="menu-page">
            <div className="container menu-container">
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
                    </div>

                    <div className="category-filter">
                        <button
                            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('all')}
                        >
                            Tất cả
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`category-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(category.id.toString())}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

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
                            <p className="no-products">Không tìm thấy món ăn nào</p>
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
                                                    onClick={() => handleAddToCart(product.id)}
                                                    disabled={!product.is_available}
                                                >
                                                    {product.is_available ? 'Thêm vào giỏ' : 'Hết hàng'}
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