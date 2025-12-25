import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthToken = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    console.log('🔑 Getting auth token:', token ? 'Found' : 'Not found');
    return token;
};

const userService = {
    getAll: async (params = {}) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            console.log('📡 Fetching users...');

            const response = await axios.get(`${API_URL}/users/`, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('✅ Users fetched successfully:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching users:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    getById: async (id) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            const response = await axios.get(`${API_URL}/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching user:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    create: async (userData) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            console.log('📤 Creating user:', userData);

            const response = await axios.post(
                `${API_URL}/users/`,
                userData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ User created:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating user:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    update: async (id, userData) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            console.log(`📝 Updating user ${id}:`, userData);

            const response = await axios.put(
                `${API_URL}/users/${id}`,
                userData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ User updated:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating user:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    delete: async (id) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            console.log(`🗑️ Deleting user ${id}`);

            const response = await axios.delete(`${API_URL}/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('✅ User deleted');
            return response.data;
        } catch (error) {
            console.error('❌ Error deleting user:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    // Ban/Unban functions (chỉ dùng is_active field có sẵn)
    banUser: async (id) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            console.log(`🚫 Banning user ${id}`);

            // Chỉ cần set is_active = false
            const response = await axios.put(
                `${API_URL}/users/${id}`,
                { is_active: false },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ User banned');
            return response.data;
        } catch (error) {
            console.error('❌ Error banning user:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    },

    unbanUser: async (id) => {
        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }

            console.log(`✅ Unbanning user ${id}`);

            // Set is_active = true
            const response = await axios.put(
                `${API_URL}/users/${id}`,
                { is_active: true },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ User unbanned');
            return response.data;
        } catch (error) {
            console.error('❌ Error unbanning user:', error);

            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }

            throw error;
        }
    }
};

export default userService;
