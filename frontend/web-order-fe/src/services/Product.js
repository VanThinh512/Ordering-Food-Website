import api from '../config/axios';

const productService = {
    getAll: async (params = {}) => {
        const response = await api.get('/products/', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    getByCategory: async (categoryId) => {
        const response = await api.get(`/products/category/${categoryId}`);
        return response.data;
    },

    search: async (keyword) => {
        const response = await api.get('/products/', {
            params: { search: keyword }
        });
        return response.data;
    },
};

export default productService;