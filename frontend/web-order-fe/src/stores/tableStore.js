import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const useTableStore = create(
    persist(
        (set, get) => ({
            availableTables: [],
            selectedTable: null,
            isLoading: false,
            error: null,

            fetchAvailableTables: async () => {
                set({ isLoading: true, error: null });
                try {
                    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                    const response = await axios.get(`${API_URL}/tables/available`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    console.log('📋 Available tables:', response.data);
                    set({ availableTables: response.data, isLoading: false });
                } catch (error) {
                    console.error('Error fetching tables:', error);
                    set({
                        error: error.response?.data?.detail || 'Failed to fetch tables',
                        isLoading: false
                    });
                }
            },

            selectTable: (table) => {
                console.log('✅ Selecting table:', table);
                set({ selectedTable: table });
                // Lưu vào localStorage để persist
                localStorage.setItem('selectedTable', JSON.stringify(table));
            },

            clearSelectedTable: () => {
                console.log('🗑️ Clearing selected table');
                set({ selectedTable: null });
                localStorage.removeItem('selectedTable');
            },

            getSelectedTable: () => {
                const state = get();

                // Ưu tiên lấy từ state
                if (state.selectedTable) {
                    console.log('📍 Table from state:', state.selectedTable);
                    return state.selectedTable;
                }

                // Nếu không có trong state, thử restore từ localStorage
                const stored = localStorage.getItem('selectedTable');
                if (stored) {
                    try {
                        const table = JSON.parse(stored);
                        console.log('📍 Table from localStorage:', table);
                        // Set lại vào state
                        set({ selectedTable: table });
                        return table;
                    } catch (e) {
                        console.error('Failed to parse stored table:', e);
                        localStorage.removeItem('selectedTable');
                        return null;
                    }
                }

                console.warn('⚠️ No table selected');
                return null;
            },

            // Thêm hàm cập nhật trạng thái bàn
            updateTableStatus: async (tableId, newStatus) => {
                try {
                    const token = localStorage.getItem('access_token') || localStorage.getItem('token');

                    console.log(`🔄 Updating table ${tableId} status to: ${newStatus}`);

                    const response = await axios.put(
                        `${API_URL}/tables/${tableId}`,
                        { status: newStatus },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    console.log('✅ Table status updated:', response.data);

                    // Cập nhật trong availableTables
                    const { availableTables } = get();
                    const updatedTables = availableTables.map(table =>
                        table.id === tableId ? { ...table, status: newStatus } : table
                    );
                    set({ availableTables: updatedTables });

                    // Nếu đang select table này, cập nhật luôn selectedTable
                    const { selectedTable } = get();
                    if (selectedTable && selectedTable.id === tableId) {
                        const updatedSelectedTable = { ...selectedTable, status: newStatus };
                        set({ selectedTable: updatedSelectedTable });
                        localStorage.setItem('selectedTable', JSON.stringify(updatedSelectedTable));
                    }

                    return response.data;
                } catch (error) {
                    console.error('❌ Error updating table status:', error);
                    throw error;
                }
            },

            // Thêm hàm lấy tất cả bàn (bao gồm cả occupied)
            fetchAllTables: async () => {
                set({ isLoading: true, error: null });
                try {
                    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                    const response = await axios.get(`${API_URL}/tables/`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    console.log('📋 All tables:', response.data);
                    set({ availableTables: response.data, isLoading: false });
                } catch (error) {
                    console.error('Error fetching all tables:', error);
                    set({
                        error: error.response?.data?.detail || 'Failed to fetch tables',
                        isLoading: false
                    });
                }
            }
        }),
        {
            name: 'table-storage',
            partialize: (state) => ({
                selectedTable: state.selectedTable
            })
        }
    )
);