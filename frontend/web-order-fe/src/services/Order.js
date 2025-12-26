import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
};

const orderService = {
    create: async (orderData) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }

            const response = await axios.post(
                `${API_URL}/orders/`,
                orderData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    getMyOrders: async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }

            const response = await axios.get(`${API_URL}/orders/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching my orders:', error);
            throw error;
        }
    },

    getAll: async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }

            const response = await axios.get(`${API_URL}/orders/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/orders/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    updateStatus: async (id, status) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }

            const response = await axios.patch(
                `${API_URL}/orders/${id}/status`,
                { status },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    cancelOrder: async (id) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }

            const response = await axios.post(`${API_URL}/orders/${id}/cancel`, null, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }

            const response = await axios.delete(`${API_URL}/orders/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    }
};

export default orderService;