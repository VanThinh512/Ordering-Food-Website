import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            tableId: null,
            tableName: null,
            isLoading: false,
            error: null,

            // Kiểm tra token
            checkToken: () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Vui lòng đăng nhập lại!');
                }
                return token;
            },

            // Lấy giỏ hàng từ server
            fetchCart: async () => {
                set({ isLoading: true, error: null });
                try {
                    const token = get().checkToken();

                    const response = await axios.get(`${API_URL}/cart/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log('Cart fetched:', response.data);
                    set({
                        items: response.data.items || [],
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Error fetching cart:', error);

                    // Nếu lỗi 401, redirect to login
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        return;
                    }

                    set({
                        error: error.response?.data?.detail || 'Failed to fetch cart',
                        isLoading: false,
                        items: []
                    });
                }
            },

            // Thêm món vào giỏ hàng
            addToCart: async (product) => {
                set({ isLoading: true, error: null });
                try {
                    const token = get().checkToken();

                    console.log('Adding to cart:', product);

                    const response = await axios.post(
                        `${API_URL}/cart/items`,
                        {
                            product_id: product.id,
                            quantity: product.quantity || 1
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    console.log('Add to cart response:', response.data);

                    // Refresh cart from server
                    await get().fetchCart();

                    set({ isLoading: false });
                    return response.data;
                } catch (error) {
                    console.error('Error adding to cart:', error);

                    // Nếu lỗi 401, redirect to login
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        return;
                    }

                    const errorMessage = error.response?.data?.detail || error.message || 'Failed to add to cart';
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    throw new Error(errorMessage);
                }
            },

            // Cập nhật số lượng
            updateQuantity: async (itemId, quantity) => {
                set({ isLoading: true, error: null });
                try {
                    const token = get().checkToken();

                    if (quantity <= 0) {
                        await get().removeFromCart(itemId);
                        return;
                    }

                    await axios.put(
                        `${API_URL}/cart/items/${itemId}`,
                        { quantity },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    // Refresh from server
                    await get().fetchCart();
                } catch (error) {
                    console.error('Error updating quantity:', error);

                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        return;
                    }

                    set({
                        error: error.response?.data?.detail || 'Failed to update quantity',
                        isLoading: false
                    });
                }
            },

            // Xóa món khỏi giỏ
            removeFromCart: async (itemId) => {
                set({ isLoading: true, error: null });
                try {
                    const token = get().checkToken();

                    await axios.delete(`${API_URL}/cart/items/${itemId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const { items } = get();
                    set({
                        items: items.filter(item => item.id !== itemId),
                        isLoading: false
                    });

                    // Refresh from server
                    await get().fetchCart();
                } catch (error) {
                    console.error('Error removing item:', error);

                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        return;
                    }

                    set({
                        error: error.response?.data?.detail || 'Failed to remove item',
                        isLoading: false
                    });
                }
            },

            // Xóa toàn bộ giỏ hàng
            clearCart: async () => {
                set({ isLoading: true, error: null });
                try {
                    const token = get().checkToken();

                    await axios.delete(`${API_URL}/cart/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    set({
                        items: [],
                        tableId: null,
                        tableName: null,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Error clearing cart:', error);

                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                        return;
                    }

                    set({
                        error: error.response?.data?.detail || 'Failed to clear cart',
                        isLoading: false
                    });
                }
            },

            // Tính tổng tiền
            getTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => {
                    const price = item.price_at_time || item.product?.price || 0;
                    return total + (price * item.quantity);
                }, 0);
            },

            // Đếm số lượng món
            getItemCount: () => {
                const { items } = get();
                return items.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({
                tableId: state.tableId,
                tableName: state.tableName
            })
        }
    )
);