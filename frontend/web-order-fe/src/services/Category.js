import api from '../config/axios';

const categoryService = {
    getAll: async () => {
        const response = await api.get('/categories/');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },
};

export default categoryService;