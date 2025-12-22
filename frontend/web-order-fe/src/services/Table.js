import api from '../config/axios';

export const tableService = {
    getAll: async () => {
        const response = await api.get('/tables/');
        return response.data;
    },

    getAvailable: async () => {
        const response = await api.get('/tables/available');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/tables/${id}`);
        return response.data;
    },
};

export default tableService;