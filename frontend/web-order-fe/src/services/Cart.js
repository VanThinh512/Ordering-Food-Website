import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthToken = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    console.log('🔑 Getting auth token:', token ? 'Found' : 'Not found');
    return token;
};

const cartService = {
    // GET /carts/ - Get cart
    getCart: async () => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Vui lòng đăng nhập để xem giỏ hàng');
            }

            console.log('📦 Fetching cart...');

            const response = await axios.get(`${API_URL}/carts/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('✅ Cart fetched:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error getting cart:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    // POST /carts/items - Add item to cart
    addItem: async (productId, quantity = 1) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
            }

            console.log('📦 Adding item to cart:', { product_id: productId, quantity });

            const response = await axios.post(
                `${API_URL}/carts/items`,
                {
                    product_id: productId,
                    quantity: quantity
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ Item added to cart:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            console.error('Response:', error.response?.data);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail);
            }

            throw new Error('Không thể thêm sản phẩm vào giỏ hàng');
        }
    },

    // PUT /carts/items/{item_id} - Update item quantity
    updateItem: async (itemId, quantity) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Vui lòng đăng nhập để cập nhật giỏ hàng');
            }

            console.log(`📝 Updating cart item ${itemId}:`, { quantity });

            const response = await axios.put(
                `${API_URL}/carts/items/${itemId}`,
                { quantity: quantity },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ Cart item updated:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating cart item:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    // DELETE /carts/items/{item_id} - Remove item from cart
    removeItem: async (itemId) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng');
            }

            console.log(`🗑️ Removing cart item ${itemId}`);

            const response = await axios.delete(
                `${API_URL}/carts/items/${itemId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ Cart item removed');
            return response.data;
        } catch (error) {
            console.error('❌ Error removing cart item:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    // DELETE /carts/ - Clear cart
    clearCart: async () => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Vui lòng đăng nhập để xóa giỏ hàng');
            }

            console.log('🧹 Clearing cart');

            const response = await axios.delete(
                `${API_URL}/carts/`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ Cart cleared');
            return response.data;
        } catch (error) {
            console.error('❌ Error clearing cart:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },
};

export default cartService;