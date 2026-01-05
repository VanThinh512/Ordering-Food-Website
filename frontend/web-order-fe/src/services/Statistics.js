import axios from '../config/axios';

const statisticsService = {
    /**
     * Get overview statistics
     */
    getOverview: async () => {
        const response = await axios.get('/statistics/overview');
        return response.data;
    },

    /**
     * Get revenue statistics
     * @param {Object} params - { year?, month? }
     */
    getRevenue: async (params = {}) => {
        const response = await axios.get('/statistics/revenue', { params });
        return response.data;
    },

    /**
     * Get monthly revenue for a year
     * @param {number} year
     */
    getRevenueByMonth: async (year) => {
        const response = await axios.get('/statistics/revenue-by-month', {
            params: { year }
        });
        return response.data;
    },

    /**
     * Get orders statistics
     * @param {Object} params - { year?, month? }
     */
    getOrders: async (params = {}) => {
        const response = await axios.get('/statistics/orders', { params });
        return response.data;
    },

    /**
     * Get reservations statistics
     * @param {Object} params - { year?, month? }
     */
    getReservations: async (params = {}) => {
        const response = await axios.get('/statistics/reservations', { params });
        return response.data;
    }
};

export default statisticsService;
