// import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>School Food Order</h3>
                        <p>Hệ thống đặt đồ ăn trường học</p>
                    </div>

                    <div className="footer-section">
                        <h4>Liên hệ</h4>
                        <p>📞 Hotline: 1900-xxxx</p>
                        <p>📧 Email: support@schoolfood.vn</p>
                    </div>

                    <div className="footer-section">
                        <h4>Giờ hoạt động</h4>
                        <p>Thứ 2 - Thứ 6: 7:00 - 17:00</p>
                        <p>Thứ 7: 7:00 - 12:00</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2024 School Food Order. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;