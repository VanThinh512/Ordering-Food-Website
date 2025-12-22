import api from '../config/axios';

const cartService = {
    getCart: async () => {
        const response = await api.get('/carts/my-cart');
        return response.data;
    },

    addItem: async (productId, quantity) => {
        const response = await api.post('/carts/items', {
            product_id: productId,
            quantity,
        });
        return response.data;
    },

    updateItem: async (itemId, quantity) => {
        const response = await api.put(`/carts/items/${itemId}`, { quantity });
        return response.data;
    },

    removeItem: async (itemId) => {
        const response = await api.delete(`/carts/items/${itemId}`);
        return response.data;
    },

    clearCart: async () => {
        const response = await api.delete('/carts/clear');
        return response.data;
    },
};

export default cartService;