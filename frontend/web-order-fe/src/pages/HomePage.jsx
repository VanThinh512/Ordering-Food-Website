import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import categoryService from '../services/Category';

const HomePage = () => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.getAll();
                setCategories(data.slice(0, 4));
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    return (
        <div className="home-page">
            <section className="hero">
                <div className="hero-content">
                    <h1>Chào mừng đến với School Food Order</h1>
                    <p>Đặt đồ ăn nhanh chóng, tiện lợi cho học sinh</p>
                    <Link to="/menu" className="btn-hero">
                        Xem thực đơn ngay
                    </Link>
                </div>
            </section>

            <section className="features">
                <div className="container">
                    <h2>Tại sao chọn chúng tôi?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🚀</div>
                            <h3>Nhanh chóng</h3>
                            <p>Đặt hàng và nhận đồ ăn chỉ trong vài phút</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🍔</div>
                            <h3>Đa dạng</h3>
                            <p>Nhiều lựa chọn món ăn phong phú</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💰</div>
                            <h3>Tiết kiệm</h3>
                            <p>Giá cả phải chăng cho học sinh</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">✅</div>
                            <h3>An toàn</h3>
                            <p>Đảm bảo vệ sinh an toàn thực phẩm</p>
                        </div>
                    </div>
                </div>
            </section>

            {categories.length > 0 && (
                <section className="categories-preview">
                    <div className="container">
                        <h2>Danh mục phổ biến</h2>
                        <div className="categories-grid">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/menu?category=${category.id}`}
                                    className="category-card"
                                >
                                    <div className="category-icon">{category.icon || '🍽️'}</div>
                                    <h3>{category.name}</h3>
                                    <p>{category.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default HomePage;