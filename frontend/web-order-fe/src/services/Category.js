import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
};

const categoryService = {
    getAll: async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/categories/`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/categories/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching category:', error);
            throw error;
        }
    },

    create: async (categoryData) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
            }

            console.log('Creating category with data:', categoryData);

            const response = await axios.post(
                `${API_URL}/categories/`,
                categoryData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Category created:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    update: async (id, categoryData) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
            }

            console.log(`Updating category ${id} with data:`, categoryData);

            const response = await axios.put(
                `${API_URL}/categories/${id}`,
                categoryData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Category updated:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
            }

            console.log(`Deleting category ${id}`);

            const response = await axios.delete(
                `${API_URL}/categories/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('Category deleted:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
};

export default categoryService;