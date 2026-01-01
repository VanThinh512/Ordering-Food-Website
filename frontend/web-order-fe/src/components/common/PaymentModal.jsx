import { useState } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ 
    isOpen, 
    onClose, 
    orderAmount, 
    orderId,
    onConfirmPayment 
}) => {
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    // Generate VietQR URL
    const generateQRCode = () => {
        const bankId = '970422'; // MBBank
        const accountNo = '7053765633';
        const accountName = 'PHAM MINH TAN';
        const amount = Math.round(orderAmount);
        const description = `FOODORDER ${orderId || 'TEMP'}`;
        
        return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirmPayment(selectedMethod);
        } catch (error) {
            console.error('Payment confirmation error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                <button className="payment-modal-close" onClick={onClose}>✕</button>
                
                <div className="payment-modal-header">
                    <h2>Chọn phương thức thanh toán</h2>
                    <p className="payment-amount">Tổng tiền: <strong>{orderAmount.toLocaleString('vi-VN')}đ</strong></p>
                </div>

                <div className="payment-methods">
                    {/* Tiền mặt */}
                    <div 
                        className={`payment-method-card ${selectedMethod === 'cash' ? 'active' : ''}`}
                        onClick={() => setSelectedMethod('cash')}
                    >
                        <div className="payment-method-icon">💵</div>
                        <div className="payment-method-info">
                            <h3>Tiền mặt</h3>
                            <p>Thanh toán trực tiếp khi nhận món</p>
                        </div>
                        <div className="payment-method-radio">
                            {selectedMethod === 'cash' && <span className="radio-checked">✓</span>}
                        </div>
                    </div>

                    {/* Online Banking */}
                    <div 
                        className={`payment-method-card ${selectedMethod === 'online' ? 'active' : ''}`}
                        onClick={() => setSelectedMethod('online')}
                    >
                        <div className="payment-method-icon">🏦</div>
                        <div className="payment-method-info">
                            <h3>Chuyển khoản ngân hàng</h3>
                            <p>Quét mã QR để thanh toán</p>
                        </div>
                        <div className="payment-method-radio">
                            {selectedMethod === 'online' && <span className="radio-checked">✓</span>}
                        </div>
                    </div>
                </div>

                {/* QR Code for online payment */}
                {selectedMethod === 'online' && (
                    <div className="qr-code-section">
                        <div className="qr-code-container">
                            <img 
                                src={generateQRCode()} 
                                alt="QR Code thanh toán"
                                className="qr-code-image"
                            />
                        </div>
                        <div className="qr-instructions">
                            <p className="qr-title">Hướng dẫn thanh toán:</p>
                            <ol>
                                <li>Mở app ngân hàng hoặc ví điện tử</li>
                                <li>Chọn <strong>Quét mã QR</strong></li>
                                <li>Quét mã QR bên trên</li>
                                <li>Kiểm tra thông tin và <strong>Xác nhận chuyển khoản</strong></li>
                            </ol>
                            <div className="bank-info">
                                <p><strong>Ngân hàng:</strong> MB Bank (MBBank)</p>
                                <p><strong>Số tài khoản:</strong> 7053765633</p>
                                <p><strong>Chủ tài khoản:</strong> PHAM TAN</p>
                                <p><strong>Số tiền:</strong> {orderAmount.toLocaleString('vi-VN')}đ</p>
                                <p><strong>Nội dung:</strong> FOODORDER {orderId || 'TEMP'}</p>
                            </div>
                            <div className="payment-warning">
                                ⚠️ <strong>Lưu ý:</strong> Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống xác nhận tự động
                            </div>
                        </div>
                    </div>
                )}

                <div className="payment-modal-actions">
                    <button 
                        className="btn-cancel-payment" 
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        Hủy
                    </button>
                    <button 
                        className="btn-confirm-payment" 
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Đang xử lý...' : 
                         selectedMethod === 'cash' ? 'Xác nhận đặt hàng' : 
                         'Tôi đã chuyển khoản'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
