import { create } from 'zustand';
import cartService from '../services/Cart';

export const useCartStore = create((set, get) => ({
    cart: null,
    isLoading: false,

    fetchCart: async () => {
        set({ isLoading: true });
        try {
            const cart = await cartService.getCart();
            set({ cart, isLoading: false });
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            set({ cart: null, isLoading: false });
        }
    },

    addToCart: async (productId, quantity) => {
        try {
            await cartService.addItem(productId, quantity);
            await get().fetchCart();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Không thể thêm vào giỏ hàng' };
        }
    },

    updateQuantity: async (itemId, quantity) => {
        try {
            await cartService.updateItem(itemId, quantity);
            await get().fetchCart();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail };
        }
    },

    removeItem: async (itemId) => {
        try {
            await cartService.removeItem(itemId);
            await get().fetchCart();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail };
        }
    },

    clearCart: async () => {
        try {
            await cartService.clearCart();
            set({ cart: null });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail };
        }
    },
}));