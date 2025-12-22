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
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${API_URL}/tables/available`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
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
                console.log('Selecting table in store:', table);
                set({ selectedTable: table });
                localStorage.setItem('selectedTable', JSON.stringify(table));
            },

            clearSelectedTable: () => {
                set({ selectedTable: null });
                localStorage.removeItem('selectedTable');
            },

            getSelectedTable: () => {
                const state = get();
                if (state.selectedTable) {
                    return state.selectedTable;
                }
                const stored = localStorage.getItem('selectedTable');
                if (stored) {
                    try {
                        const table = JSON.parse(stored);
                        set({ selectedTable: table });
                        return table;
                    } catch (e) {
                        console.error('Failed to parse stored table:', e);
                        return null;
                    }
                }
                return null;
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