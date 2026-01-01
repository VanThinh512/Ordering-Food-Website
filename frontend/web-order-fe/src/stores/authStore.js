import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const useAuthStore = create((set, get) => ({
    user: null,

    token: localStorage.getItem('access_token'),
    isAuthenticated: !!localStorage.getItem('access_token'),

    login: async (email, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await axios.post(`${API_URL}/auth/login`, formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const { access_token, requires_2fa, user_id } = response.data;
            
            // Check if 2FA is required
            if (requires_2fa) {
                return {
                    success: true,
                    requires2FA: true,
                    userId: user_id
                };
            }

            localStorage.setItem('access_token', access_token);

            // Fetch user info
            const userResponse = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });

            const userData = userResponse.data;

            set({
                user: userData,
                token: access_token,
                isAuthenticated: true,
            });

            return {
                success: true,
                user: userData  // Return user data để check role
            };
        } catch (error) {
            console.error('Login error:', error);

            // Check if user is banned (400 status with "Inactive user")
            if (error.response?.status === 400 &&
                error.response?.data?.detail === 'Inactive user') {
                return {
                    success: false,
                    error: 'Tài khoản của bạn đã bị khóa',
                    errorData: {
                        message: 'Tài khoản của bạn đã bị quản trị viên khóa',
                        ban_reason: 'Vi phạm chính sách sử dụng hoặc hành vi không phù hợp',
                        is_permanent: true
                    }
                };
            }

            return {
                success: false,
                error: error.response?.data?.detail || 'Email hoặc mật khẩu không đúng',
            };
        }
    },

    register: async (userData) => {
        try {
            await axios.post(`${API_URL}/auth/register`, userData);
            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                error: error.response?.data?.detail || 'Đăng ký thất bại',
            };
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            set({
                user: response.data,
                token,
                isAuthenticated: true,
            });
        } catch (error) {
            console.error('Load user failed:', error);
            localStorage.removeItem('access_token');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
            });
        }
    },

    checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            set({
                user: response.data,
                token,
                isAuthenticated: true,
            });
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('access_token');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
            });
        }
    },

    updateProfile: async (updates) => {
        const token = localStorage.getItem('access_token');
        const currentUser = get().user;

        if (!token || !currentUser) {
            return {
                success: false,
                error: 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.'
            };
        }

        try {
            const response = await axios.put(
                `${API_URL}/users/${currentUser.id}`,
                updates,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            set({ user: response.data });

            return {
                success: true,
                user: response.data,
            };
        } catch (error) {
            console.error('Update profile failed:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
                return {
                    success: false,
                    error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                };
            }

            return {
                success: false,
                error: error.response?.data?.detail || 'Không thể cập nhật thông tin',
            };
        }
    },

    changePassword: async ({ currentPassword, newPassword }) => {
        const token = localStorage.getItem('access_token');
        const currentUser = get().user;

        if (!token || !currentUser) {
            return {
                success: false,
                error: 'Vui lòng đăng nhập lại trước khi đổi mật khẩu.',
            };
        }

        try {
            await axios.post(
                `${API_URL}/users/${currentUser.id}/change-password`,
                {
                    current_password: currentPassword,
                    new_password: newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return { success: true };
        } catch (error) {
            console.error('Change password failed:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
                return {
                    success: false,
                    error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                };
            }

            return {
                success: false,
                error: error.response?.data?.detail || 'Không thể đổi mật khẩu',
            };
        }
    },
}));