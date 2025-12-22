import { create } from 'zustand';
import orderService from '../services/Order';

export const useOrderStore = create((set, get) => ({
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,

    fetchMyOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const orders = await orderService.getMyOrders();
            set({ orders, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createOrder: async (orderData) => {
        set({ isLoading: true, error: null });
        try {
            const order = await orderService.create(orderData);
            set({ currentOrder: order, isLoading: false });
            return { success: true, order };
        } catch (error) {
            set({ error: error.response?.data?.detail, isLoading: false });
            return { success: false, error: error.response?.data?.detail };
        }
    },

    cancelOrder: async (orderId) => {
        set({ isLoading: true, error: null });
        try {
            await orderService.cancelOrder(orderId);
            await get().fetchMyOrders();
            set({ isLoading: false });
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.detail, isLoading: false });
            return { success: false, error: error.response?.data?.detail };
        }
    },

    clearCurrentOrder: () => set({ currentOrder: null }),
}));