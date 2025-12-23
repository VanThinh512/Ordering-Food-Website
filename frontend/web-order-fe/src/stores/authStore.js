import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/Auth';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (username, password) => {
                set({ isLoading: true });
                try {
                    const data = await authService.login(username, password);

                    // Lưu token vào cả 2 key để tương thích
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('token', data.access_token);

                    const user = await authService.getCurrentUser();

                    console.log('Login success - User data:', user);
                    console.log('Token saved:', data.access_token.substring(0, 20) + '...');

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    return { success: true };
                } catch (error) {
                    console.error('Login error:', error);
                    set({ isLoading: false });
                    return {
                        success: false,
                        error: error.response?.data?.detail || 'Đăng nhập thất bại'
                    };
                }
            },

            register: async (userData) => {
                set({ isLoading: true });
                try {
                    await authService.register(userData);
                    set({ isLoading: false });
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false });
                    return {
                        success: false,
                        error: error.response?.data?.detail || 'Đăng ký thất bại'
                    };
                }
            },

            logout: () => {
                authService.logout();
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                localStorage.removeItem('cart-storage');
                localStorage.removeItem('table-storage');
                set({ user: null, isAuthenticated: false });
            },

            // Thêm hàm checkAuth
            checkAuth: async () => {
                const token = localStorage.getItem('access_token') || localStorage.getItem('token');

                if (!token) {
                    console.log('No token found');
                    set({ user: null, isAuthenticated: false });
                    return;
                }

                try {
                    console.log('Checking auth with token:', token.substring(0, 20) + '...');

                    const user = await authService.getCurrentUser();

                    console.log('Auth check success:', user);

                    // Đảm bảo token có ở cả 2 key
                    localStorage.setItem('access_token', token);
                    localStorage.setItem('token', token);

                    set({
                        user,
                        isAuthenticated: true
                    });
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('token');
                    set({ user: null, isAuthenticated: false });
                }
            },

            // Giữ loadUser cho tương thích ngược
            loadUser: async () => {
                await get().checkAuth();
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);