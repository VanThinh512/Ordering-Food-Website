import { useState, useEffect } from 'react';
import axios from '../../config/axios';

const TwoFactorAuth = () => {
    const [twoFAStatus, setTwoFAStatus] = useState({
        is_2fa_enabled: false,
        loading: true
    });
    const [setupData, setSetupData] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load 2FA status on mount
    useEffect(() => {
        loadTwoFAStatus();
    }, []);

    const loadTwoFAStatus = async () => {
        try {
            const response = await axios.get('/auth/2fa/status');
            setTwoFAStatus({
                is_2fa_enabled: response.data.is_2fa_enabled,
                loading: false
            });
        } catch (err) {
            console.error('Failed to load 2FA status:', err);
            setTwoFAStatus({ is_2fa_enabled: false, loading: false });
        }
    };

    const handleSetup2FA = async () => {
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const response = await axios.post('/auth/2fa/setup');
            setSetupData(response.data);
            setSuccess('QR code đã được tạo. Hãy quét mã bằng Google Authenticator!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Không thể thiết lập 2FA');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEnable2FA = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            await axios.post('/auth/2fa/enable', null, {
                params: { token: verificationCode }
            });
            setSuccess('✅ Đã bật 2FA thành công!');
            setVerificationCode('');
            setSetupData(null);
            loadTwoFAStatus();
        } catch (err) {
            setError(err.response?.data?.detail || 'Mã xác thực không đúng');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDisable2FA = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            await axios.post('/auth/2fa/disable', null, {
                params: { password: disablePassword }
            });
            setSuccess('✅ Đã tắt 2FA thành công!');
            setDisablePassword('');
            loadTwoFAStatus();
        } catch (err) {
            setError(err.response?.data?.detail || 'Mật khẩu không đúng');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (twoFAStatus.loading) {
        return <div>Đang tải...</div>;
    }

    return (
        <section className="profile-maincard">
            <div className="profile-card-header">
                <div>
                    <p className="eyebrow">Bảo mật nâng cao</p>
                    <h2>Xác thực 2 lớp (2FA)</h2>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                        Bảo vệ tài khoản với Google Authenticator
                    </p>
                </div>
                <div className="header-actions">
                    {twoFAStatus.is_2fa_enabled ? (
                        <span className="badge badge-success">✓ Đã bật</span>
                    ) : (
                        <span className="badge badge-warning">Chưa bật</span>
                    )}
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}

            {!twoFAStatus.is_2fa_enabled ? (
                // Enable 2FA flow
                <div>
                    {!setupData ? (
                        <div className="two-fa-intro">
                            <div className="two-fa-steps">
                                <h4>Cách thiết lập:</h4>
                                <ol>
                                    <li>Nhấn "Bắt đầu thiết lập" bên dưới</li>
                                    <li>Tải app <strong>Google Authenticator</strong> trên điện thoại</li>
                                    <li>Quét mã QR hiển thị</li>
                                    <li>Nhập mã 6 số để xác nhận</li>
                                </ol>
                            </div>
                            <button 
                                className="btn-primary"
                                onClick={handleSetup2FA}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang tạo...' : '🔐 Bắt đầu thiết lập'}
                            </button>
                        </div>
                    ) : (
                        <div className="two-fa-setup">
                            <div className="qr-code-section">
                                <h4>Bước 1: Quét mã QR</h4>
                                <div className="qr-code-container">
                                    <img 
                                        src={setupData.qr_code} 
                                        alt="2FA QR Code"
                                        style={{ 
                                            maxWidth: '250px', 
                                            borderRadius: '8px', 
                                            display: 'block',
                                            margin: '0 auto'
                                        }}
                                    />
                                </div>
                                <p className="help-text">
                                    Mở Google Authenticator, chọn <strong>+</strong> → <strong>Quét mã QR</strong>
                                </p>
                            </div>

                            <div className="manual-entry">
                                <details>
                                    <summary>Không quét được? Nhập thủ công</summary>
                                    <div className="secret-key">
                                        <code>{setupData.secret}</code>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(setupData.secret)}
                                            className="btn-ghost btn-sm"
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                </details>
                            </div>

                            <form onSubmit={handleEnable2FA} className="verification-form">
                                <h4>Bước 2: Xác nhận</h4>
                                <div className="form-field">
                                    <label htmlFor="verification-code">Nhập mã 6 số từ app</label>
                                    <input
                                        type="text"
                                        id="verification-code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength="6"
                                        pattern="[0-9]{6}"
                                        required
                                        style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button 
                                        type="button" 
                                        className="btn-secondary"
                                        onClick={() => {
                                            setSetupData(null);
                                            setVerificationCode('');
                                            setError('');
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn-primary"
                                        disabled={verificationCode.length !== 6 || isSubmitting}
                                    >
                                        {isSubmitting ? 'Đang xác nhận...' : 'Xác nhận & Bật 2FA'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            ) : (
                // Disable 2FA flow
                <div className="two-fa-enabled">
                    <div className="status-message">
                        <p>✅ Tài khoản của bạn đang được bảo vệ bởi xác thực 2 lớp.</p>
                        <p className="help-text">
                            Bạn sẽ cần nhập mã từ Google Authenticator mỗi khi đăng nhập.
                        </p>
                    </div>

                    <form onSubmit={handleDisable2FA} className="disable-form">
                        <h4>Tắt 2FA</h4>
                        <p className="warning-text">⚠️ Việc tắt 2FA sẽ làm giảm tính bảo mật tài khoản</p>
                        <div className="form-field">
                            <label htmlFor="disable-password">Nhập mật khẩu để xác nhận</label>
                            <input
                                type="password"
                                id="disable-password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Mật khẩu hiện tại"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn-danger"
                            disabled={!disablePassword || isSubmitting}
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'Tắt 2FA'}
                        </button>
                    </form>
                </div>
            )}

            <style jsx="true">{`
                .two-fa-intro {
                    padding: 20px;
                }
                .two-fa-steps {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 24px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                }
                .two-fa-steps h4 {
                    margin-bottom: 16px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                }
                .two-fa-steps ol {
                    margin-left: 20px;
                    line-height: 1.9;
                    color: rgba(226, 232, 240, 0.85);
                }
                .two-fa-steps strong {
                    color: #ffb347;
                    font-weight: 600;
                }
                .two-fa-setup {
                    padding: 20px;
                }
                .qr-code-section {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .qr-code-section h4 {
                    margin-bottom: 20px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                }
                .qr-code-container {
                    background: rgba(255, 255, 255, 0.95);
                    padding: 20px;
                    border-radius: 16px;
                    display: inline-block;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }
                }
                .help-text {
                    color: rgba(226, 232, 240, 0.7);
                    font-size: 14px;
                    margin-top: 16px;
                }
                .manual-entry {
                    margin: 24px 0;
                }
                .manual-entry details {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 16px;
                    border-radius: 8px;
                }
                .manual-entry summary {
                    cursor: pointer;
                    font-weight: 500;
                    color: rgba(226, 232, 240, 0.85);
                }
                .secret-key {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 12px;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                }
                .secret-key code {
                    flex: 1;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    color: #ffb347;
                    letter-spacing: 1px;
                }
                .verification-form h4 {
                    margin-bottom: 16px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                }
                .two-fa-enabled {
                    padding: 20px;
                }
                .status-message {
                    background: rgba(76, 175, 80, 0.1);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    padding: 24px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .status-message p {
                    margin: 8px 0;
                    color: rgba(226, 232, 240, 0.85);
                }
                .disable-form h4 {
                    margin-bottom: 16px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                }
                .warning-text {
                    color: #ffa726;
                    font-size: 14px;
                    margin-bottom: 16px;
                }
                .badge {
                    padding: 6px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .badge-success {
                    background: #4caf50;
                    color: white;
                }
                .badge-warning {
                    background: #ff9800;
                    color: white;
                }
                .btn-danger {
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                .btn-danger:hover {
                    background: #d32f2f;
                }
                .btn-danger:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
            `}</style>
        </section>
    );
};

export default TwoFactorAuth;
