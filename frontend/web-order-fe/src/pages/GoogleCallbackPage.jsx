import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const GoogleCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState('');
    const loadUser = useAuthStore((state) => state.loadUser);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get token from URL params
                const token = searchParams.get('token');
                
                if (!token) {
                    throw new Error('No token received from Google authentication');
                }

                // Save token
                localStorage.setItem('access_token', token);
                
                // Load user info
                await loadUser();
                
                setStatus('success');
                
                // Redirect after a short delay
                setTimeout(() => {
                    navigate('/menu');
                }, 1500);
                
            } catch (err) {
                console.error('Google callback error:', err);
                setStatus('error');
                setError(err.message || 'Đăng nhập Google thất bại');
                
                // Redirect to login after error
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, loadUser]);

    return (
        <div className="auth-page">
            <div className="container">
                <div className="callback-container">
                    {status === 'processing' && (
                        <div className="callback-card">
                            <div className="spinner"></div>
                            <h2>Đang xử lý đăng nhập Google...</h2>
                            <p>Vui lòng chờ trong giây lát</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="callback-card success">
                            <div className="success-icon">✓</div>
                            <h2>Đăng nhập thành công!</h2>
                            <p>Đang chuyển hướng đến trang chính...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="callback-card error">
                            <div className="error-icon">✕</div>
                            <h2>Đăng nhập thất bại</h2>
                            <p>{error}</p>
                            <p className="redirect-text">Đang chuyển về trang đăng nhập...</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .callback-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 80vh;
                }

                .callback-card {
                    background: white;
                    border-radius: 16px;
                    padding: 3rem;
                    text-align: center;
                    max-width: 500px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                }

                .spinner {
                    width: 60px;
                    height: 60px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #4285f4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .success-icon,
                .error-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    margin: 0 auto 1.5rem;
                    font-weight: bold;
                }

                .success-icon {
                    background: #34a853;
                    color: white;
                }

                .error-icon {
                    background: #ea4335;
                    color: white;
                }

                .callback-card h2 {
                    margin-bottom: 0.5rem;
                    color: #333;
                }

                .callback-card p {
                    color: #666;
                    margin: 0.5rem 0;
                }

                .redirect-text {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    color: #999;
                }
            `}</style>
        </div>
    );
};

export default GoogleCallbackPage;
