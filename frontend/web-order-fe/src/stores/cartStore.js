import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
};

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            tableId: null,
            tableName: null,
            isLoading: false,
            error: null,

            // Fetch product details
            fetchProductDetails: async (productId) => {
                try {
                    const response = await axios.get(`${API_URL}/products/${productId}`);
                    return response.data;
                } catch (error) {
                    console.error('Error fetching product:', error);
                    return null;
                }
            },

            fetchCart: async () => {
                set({ isLoading: true, error: null });
                try {
                    const token = getAuthToken();
                    if (!token) {
                        console.warn('No token found, skipping cart fetch');
                        set({ items: [], isLoading: false });
                        return;
                    }

                    console.log('📦 Fetching cart from server...');

                    const response = await axios.get(`${API_URL}/cart/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log('📦 Raw cart data:', response.data);

                    // Enrich cart items with product details
                    const cartItems = response.data.items || [];
                    const enrichedItems = await Promise.all(
                        cartItems.map(async (item) => {
                            // Nếu đã có product details thì giữ nguyên
                            if (item.product && item.product.name) {
                                console.log('✅ Item already has product details:', item);
                                return item;
                            }

                            // Nếu không có, fetch từ API
                            console.log('🔄 Fetching product details for:', item.product_id);
                            const productDetails = await get().fetchProductDetails(item.product_id);

                            return {
                                ...item,
                                product: productDetails || {
                                    id: item.product_id,
                                    name: 'Món ăn',
                                    price: item.price_at_time || 0,
                                    image_url: null
                                }
                            };
                        })
                    );

                    console.log('✅ Enriched cart items:', enrichedItems);

                    set({
                        items: enrichedItems,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('❌ Error fetching cart:', error);

                    if (error.response?.status === 401) {
                        console.warn('Token expired');
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('token');
                        set({ items: [], isLoading: false });
                        return;
                    }

                    set({
                        error: error.response?.data?.detail || 'Failed to fetch cart',
                        isLoading: false,
                        items: []
                    });
                }
            },

            addToCart: async (product) => {
                set({ isLoading: true, error: null });

                try {
                    const token = getAuthToken();

                    if (!token) {
                        const error = 'Vui lòng đăng nhập để thêm món vào giỏ hàng!';
                        console.error('No token found');
                        set({ error, isLoading: false });
                        throw new Error(error);
                    }

                    console.log('🛒 Adding to cart:', {
                        product_id: product.id,
                        quantity: product.quantity || 1,
                        product_name: product.name
                    });

                    const response = await axios.post(
                        `${API_URL}/cart/items`,
                        {
                            product_id: product.id,
                            quantity: product.quantity || 1
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    console.log('✅ Add to cart success:', response.data);

                    // Update local state with full product info
                    const { items } = get();
                    const existingItemIndex = items.findIndex(
                        item => item.product_id === product.id
                    );

                    if (existingItemIndex >= 0) {
                        const updatedItems = [...items];
                        updatedItems[existingItemIndex].quantity += (product.quantity || 1);
                        set({ items: updatedItems, isLoading: false });
                    } else {
                        const newItem = {
                            id: response.data.cart_item?.id,
                            product_id: product.id,
                            quantity: product.quantity || 1,
                            price_at_time: product.price,
                            product: {
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image_url: product.image_url,
                                description: product.description
                            }
                        };

                        console.log('➕ Adding new item to local state:', newItem);

                        set({
                            items: [...items, newItem],
                            tableId: product.tableId,
                            tableName: product.tableName,
                            isLoading: false
                        });
                    }

                    // Refresh cart from server
                    setTimeout(() => get().fetchCart(), 500);

                    return response.data;
                } catch (error) {
                    console.error('❌ Error adding to cart:', error);

                    if (error.response?.status === 401) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('token');
                        const errorMsg = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
                        set({ error: errorMsg, isLoading: false });

                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);

                        throw new Error(errorMsg);
                    }

                    const errorMessage = error.response?.data?.detail || error.message || 'Không thể thêm vào giỏ hàng';
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    throw new Error(errorMessage);
                }
            },

            updateQuantity: async (itemId, quantity) => {
                set({ isLoading: true, error: null });
                try {
                    const token = getAuthToken();
                    if (!token) throw new Error('Vui lòng đăng nhập!');

                    if (quantity <= 0) {
                        await get().removeFromCart(itemId);
                        return;
                    }

                    console.log('🔄 Updating quantity:', { itemId, quantity });

                    await axios.put(
                        `${API_URL}/cart/items/${itemId}`,
                        { quantity },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    // Update local state
                    const { items } = get();
                    set({
                        items: items.map(item =>
                            item.id === itemId ? { ...item, quantity } : item
                        ),
                        isLoading: false
                    });

                    // Refresh from server
                    setTimeout(() => get().fetchCart(), 300);
                } catch (error) {
                    console.error('Error updating quantity:', error);

                    if (error.response?.status === 401) {
                        localStorage.removeItem('access_token');
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

            removeFromCart: async (itemId) => {
                set({ isLoading: true, error: null });
                try {
                    const token = getAuthToken();
                    if (!token) throw new Error('Vui lòng đăng nhập!');

                    console.log('🗑️ Removing item:', itemId);

                    await axios.delete(`${API_URL}/cart/items/${itemId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const { items } = get();
                    set({
                        items: items.filter(item => item.id !== itemId),
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Error removing item:', error);

                    if (error.response?.status === 401) {
                        localStorage.removeItem('access_token');
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

            clearCart: async () => {
                set({ isLoading: true, error: null });
                try {
                    const token = getAuthToken();
                    if (!token) throw new Error('Vui lòng đăng nhập!');

                    console.log('🗑️ Clearing cart...');

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
                        localStorage.removeItem('access_token');
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

            getTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => {
                    const price = item.price_at_time || item.product?.price || 0;
                    return total + (price * item.quantity);
                }, 0);
            },

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