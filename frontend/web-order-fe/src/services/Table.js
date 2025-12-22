import api from '../config/axios';

const tableService = {
    getAll: async (params = {}) => {
        const response = await api.get('/tables/', { params });
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

    create: async (tableData) => {
        const response = await api.post('/tables/', tableData);
        return response.data;
    },

    update: async (id, tableData) => {
        const response = await api.put(`/tables/${id}`, tableData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/tables/${id}`);
        return response.data;
    },
};

export default tableService;