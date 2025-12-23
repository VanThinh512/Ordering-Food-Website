import api from '../config/axios';

const userService = {
    getAll: async (params = {}) => {
        const response = await api.get('/users/', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    }
};

export default userService;
