import api from '../config/axios';

const orderService = {
    create: async (orderData) => {
        const response = await api.post('/orders/', orderData);
        return response.data;
    },

    getMyOrders: async (params = {}) => {
        const response = await api.get('/orders/my-orders', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    cancelOrder: async (id) => {
        const response = await api.post(`/orders/${id}/cancel`);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await api.put(`/orders/${id}/status`, { status });
        return response.data;
    },
};

export default orderService;