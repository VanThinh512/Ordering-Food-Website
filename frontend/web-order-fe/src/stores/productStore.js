import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const useProductStore = create((set) => ({
    products: [],
    categories: [],
    isLoading: false,
    error: null,

    fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/products/`);
            set({ products: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.detail || 'Failed to fetch products',
                isLoading: false
            });
        }
    },

    fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/categories/`);
            set({ categories: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.detail || 'Failed to fetch categories',
                isLoading: false
            });
        }
    }
}));