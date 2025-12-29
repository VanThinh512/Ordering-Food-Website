import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
};

const productService = {
    getAll: async (params = {}) => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/products/`, {
                params,
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    getByCategory: async (categoryId) => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/products/`, {
                params: { category_id: categoryId, available_only: true },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching products by category:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/products/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    // Thêm hàm CREATE
    create: async (productData) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
            }

            // Validate data trước khi gửi
            console.log('🔍 Validating product data:', productData);

            if (!productData.name || !productData.price || !productData.category_id) {
                throw new Error('Thiếu thông tin bắt buộc');
            }

            // Đảm bảo price là number
            const payload = {
                name: String(productData.name),
                description: String(productData.description || ''),
                price: Number(productData.price),
                category_id: Number(productData.category_id),
                image_url: String(productData.image_url || ''),
                is_available: Boolean(productData.is_available ?? true)
            };

            console.log('📤 Final payload:', payload);
            console.log('🔑 Auth token:', token ? 'Present' : 'Missing');

            const response = await axios.post(
                `${API_URL}/products/`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ Product created:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating product:', error);
            console.error('❌ Error config:', error.config);
            console.error('❌ Error request:', error.request);
            console.error('❌ Error response:', error.response?.data);
            throw error;
        }
    },

    // Thêm hàm UPDATE
    update: async (id, productData) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
            }

            console.log(`Updating product ${id} with data:`, productData);

            const response = await axios.put(
                `${API_URL}/products/${id}`,
                productData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Product updated:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    // Thêm hàm DELETE
    delete: async (id) => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
            }

            console.log(`Deleting product ${id}`);

            const response = await axios.delete(
                `${API_URL}/products/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('Product deleted:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Thêm hàm search nếu cần
    search: async (searchTerm) => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/products/search`, {
                params: { q: searchTerm },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }
};

export default productService;
