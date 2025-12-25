import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';
const getToken = () => localStorage.getItem('access_token') || localStorage.getItem('token');
const today = () => new Date().toISOString().split('T')[0];

const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour < 21; hour += 1) {
        const start = `${hour.toString().padStart(2, '0')}:00`;
        const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
        slots.push({
            id: `${start}-${end}`,
            label: `${start} - ${end}`,
            start,
            end
        });
    }
    return slots;
};

const isOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
};

export const useTableStore = create(
    persist(
        (set, get) => ({
            availableTables: [],
            selectedTable: null,
            selectedReservation: null,
            pendingReservation: null,

            reservationDate: today(),
            availableSlots: [],
            selectedSlot: null,
            partySize: 2,
            isLoading: false,
            slotLoading: false,
            error: null,

            fetchAvailableTables: async () => {
                set({ isLoading: true, error: null });
                try {
                    const token = getToken();
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
                localStorage.setItem('selectedTable', JSON.stringify(table));
            },

            clearSelectedTable: () => {
                console.log('🗑️ Clearing selected table');
                set({ selectedTable: null });
                localStorage.removeItem('selectedTable');
                const { clearReservation } = get();
                if (clearReservation) {
                    clearReservation();
                }
            },

            getSelectedTable: () => {
                const state = get();
                if (state.selectedTable) {
                    console.log('📍 Table from state:', state.selectedTable);
                    return state.selectedTable;
                }

                const stored = localStorage.getItem('selectedTable');
                if (stored) {
                    try {
                        const table = JSON.parse(stored);
                        console.log('📍 Table from localStorage:', table);
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

            setReservationDate: (date) => {
                set({ reservationDate: date, selectedSlot: null });
            },

            setPartySize: (size) => {
                const safeSize = Math.max(1, Number(size) || 1);
                set({ partySize: safeSize });
            },

            selectSlot: (slot) => {
                set({
                    selectedSlot: slot,
                    selectedReservation:
                        slot?.reservation?.id
                            ? { ...slot.reservation, is_pending: false }
                            : get().selectedReservation
                });
            },

            fetchTableAvailability: async (tableId, date) => {
                if (!tableId) return;
                set({ slotLoading: true, error: null });
                try {
                    const token = getToken();
                    const response = await axios.get(
                        `${API_URL}/reservations/availability/${tableId}`,
                        {
                            params: { date },
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );
                    const reservations = response.data || [];
                    const slots = generateTimeSlots().map((slot) => {
                        const slotStart = new Date(`${date}T${slot.start}:00`);
                        const slotEnd = new Date(`${date}T${slot.end}:00`);
                        const conflict = reservations.find((r) => {
                            const resStart = new Date(r.start_time);
                            const resEnd = new Date(r.end_time);
                            return isOverlap(slotStart, slotEnd, resStart, resEnd);
                        });
                        return {
                            ...slot,
                            status: conflict ? (conflict.is_owned ? 'mine' : 'booked') : 'free',
                            reservation: conflict || null
                        };
                    });
                    set({
                        availableSlots: slots,
                        slotLoading: false,
                        selectedSlot: null
                    });
                } catch (error) {
                    console.error('Error fetching availability:', error);
                    set({
                        error: error.response?.data?.detail || 'Failed to fetch availability',
                        slotLoading: false,
                        availableSlots: []
                    });
                }
            },

            prepareReservation: ({ tableId, slot, date, partySize }) => {
                if (!tableId || !slot) return;
                const startTime = `${date}T${slot.start}:00`;
                const endTime = `${date}T${slot.end}:00`;
                const pending = {
                    id: null,
                    table_id: tableId,
                    start_time: startTime,
                    end_time: endTime,
                    party_size: partySize,
                    slot_id: slot.id,
                    slot_label: slot.label,
                    is_pending: true
                };
                set({ selectedReservation: pending });
                localStorage.setItem('selectedReservation', JSON.stringify(pending));
                return pending;
            },

            createReservation: async ({ tableId, startTime, endTime, partySize }) => {
                try {
                    const token = getToken();
                    const payload = {
                        table_id: tableId,
                        start_time: startTime,
                        end_time: endTime,
                        party_size: partySize
                    };
                    const response = await axios.post(
                        `${API_URL}/reservations/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('✅ Reservation created:', response.data);
                    const existing = get().selectedReservation;
                    const persisted = {
                        ...response.data,
                        is_pending: false,
                        slot_id: existing?.slot_id,
                        slot_label: existing?.slot_label
                    };
                    set({ selectedReservation: persisted });
                    localStorage.setItem('selectedReservation', JSON.stringify(persisted));
                    return persisted;
                } catch (error) {
                    console.error('Error creating reservation:', error);
                    throw error;
                }
            },

            ensureReservation: async () => {
                const reservation = get().selectedReservation;
                if (!reservation) {
                    throw new Error('Bạn chưa chọn khung giờ để giữ bàn.');
                }
                if (reservation.id) {
                    return reservation;
                }
                return await get().createReservation({
                    tableId: reservation.table_id,
                    startTime: reservation.start_time,
                    endTime: reservation.end_time,
                    partySize: reservation.party_size
                });
            },

            cancelReservation: async () => {
                const reservation = get().getSelectedReservation();
                if (!reservation?.id) {
                    get().clearReservation();
                    return;
                }

                try {
                    const token = getToken();
                    await axios.delete(`${API_URL}/reservations/${reservation.id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                } catch (error) {
                    console.error('Error cancelling reservation:', error);
                    throw error;
                } finally {
                    get().clearReservation();
                }
            },

            getSelectedReservation: () => {
                const state = get();
                if (state.selectedReservation) {
                    return state.selectedReservation;
                }

                const stored = localStorage.getItem('selectedReservation');
                if (stored) {
                    try {
                        const reservation = JSON.parse(stored);
                        set({ selectedReservation: reservation });
                        return reservation;
                    } catch (error) {
                        console.error('Failed to parse stored reservation:', error);
                        localStorage.removeItem('selectedReservation');
                        return null;
                    }
                }
                return null;
            },

            clearReservation: () => {
                set({ selectedReservation: null, selectedSlot: null });
                localStorage.removeItem('selectedReservation');
            },

            updateTableStatus: async (tableId, newStatus) => {
                try {
                    const token = getToken();
                    console.log(`🔄 Updating table ${tableId} status to: ${newStatus}`);

                    const response = await axios.put(
                        `${API_URL}/tables/${tableId}`,
                        { status: newStatus },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    console.log('✅ Table status updated:', response.data);

                    const { availableTables } = get();
                    const updatedTables = availableTables.map(table =>
                        table.id === tableId ? { ...table, status: newStatus } : table
                    );
                    set({ availableTables: updatedTables });

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

            fetchAllTables: async ({ date, slot } = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const token = getToken();
                    const params = {};
                    if (date && slot) {
                        params.date = date;
                        params.start_time = slot.start;
                        params.end_time = slot.end;
                    }
                    const response = await axios.get(`${API_URL}/tables/`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        params
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
                selectedTable: state.selectedTable,
                selectedReservation: state.selectedReservation
            })
        }
    )
);