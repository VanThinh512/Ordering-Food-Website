import { create } from 'zustand';
import authService from '../services/Auth';

export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    login: async (username, password) => {
        set({ isLoading: true });
        try {
            const data = await authService.login(username, password);
            localStorage.setItem('access_token', data.access_token);
            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true, isLoading: false });
            return { success: true };
        } catch (error) {
            set({ isLoading: false });
            return { success: false, error: error.response?.data?.detail || 'Đăng nhập thất bại' };
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
            return { success: false, error: error.response?.data?.detail || 'Đăng ký thất bại' };
        }
    },

    logout: () => {
        authService.logout();
        set({ user: null, isAuthenticated: false });
    },

    loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const user = await authService.getCurrentUser();
                set({ user, isAuthenticated: true });
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                localStorage.removeItem('access_token');
                set({ user: null, isAuthenticated: false });
            }
        }
    },
}));