import { useEffect, useState, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import { useTableStore } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';

const TablesPage = () => {
    const navigate = useNavigate();
    const {
        availableTables,
        fetchAllTables,
        selectTable,
        isLoading,
        reservationDate,
        setReservationDate,
        partySize,
        setPartySize,
        // availableSlots,
        // fetchTableAvailability,
        // slotLoading,
        // selectedSlot,
        // selectSlot,
        prepareReservation,
        selectedReservation,
        clearReservation,
        getSelectedReservation
    } = useTableStore();

    const { isAuthenticated } = useAuthStore();
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [filter, setFilter] = useState('available');
    const [pendingSlotId, setPendingSlotId] = useState('');
    const [confirmedSlot, setConfirmedSlot] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadTables();
        getSelectedReservation();
    }, [isAuthenticated]);

    const loadTables = async () => {
        await fetchAllTables();
    };

    const handleSelectTable = (table) => {
        if (table.status === 'occupied') {
            alert('Bàn này đang được sử dụng trong khung giờ đã chọn. Vui lòng chọn bàn khác.');
            return;
        }

        if (table.status === 'reserved') {
            alert('Bàn này đã được người khác giữ trước trong khung giờ này.');
            return;
        }

        setSelectedTableId(table.id);
    };

    const selectedTable = useMemo(
        () => availableTables.find((t) => t.id === selectedTableId),
        [availableTables, selectedTableId]
    );

    const formatTimeRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const formatDisplayDate = (value) => {
        if (!value) return 'Chưa chọn';
        try {
            return new Date(value).toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short'
            });
        } catch {
            return value;
        }
    };

    const handleConfirmTable = () => {
        if (!confirmedSlot) {
            alert('Vui lòng xác nhận khung giờ trước khi tiếp tục.');
            return;
        }

        if (!selectedTable) {
            alert('Vui lòng chọn bàn.');
            return;
        }

        prepareReservation({
            tableId: selectedTable.id,
            slot: confirmedSlot,
            date: reservationDate,
            partySize
        });

        selectTable(selectedTable);
        navigate('/menu');
    };

    const handleDateChange = async (event) => {
        const value = event.target.value;
        if (value) {
            setReservationDate(value);
            setPendingSlotId('');
            setConfirmedSlot(null);
            setSelectedTableId(null);
            setFilter('available');
            clearReservation();
            await fetchAllTables();
        }
    };

    const handlePartySizeChange = (event) => {
        setPartySize(event.target.value);
    };

    const timeSlots = useMemo(() => {
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
    }, []);

    const handleConfirmWindow = async () => {
        if (!pendingSlotId) {
            alert('Vui lòng chọn khung giờ trước khi xác nhận.');
            return;
        }
        const slot = timeSlots.find((item) => item.id === pendingSlotId);
        if (!slot) return;

        setConfirmedSlot(slot);
        setSelectedTableId(null);
        setFilter('available');
        clearReservation();
        await fetchAllTables({ date: reservationDate, slot });
    };

    const statusCounts = confirmedSlot
        ? {
            available: availableTables.filter(t => t.status === 'available').length,
            reserved: availableTables.filter(t => t.status === 'reserved').length,
            occupied: availableTables.filter(t => t.status === 'occupied').length
        }
        : {
            available: 0,
            reserved: 0,
            occupied: 0
        };

    const filteredTables = confirmedSlot
        ? availableTables.filter(table => table.status === filter)
        : [];

    const statusOptions = [
        { key: 'available', label: 'Bàn trống', icon: '✅' },
        { key: 'reserved', label: 'Đã đặt', icon: '⏰' },
        { key: 'occupied', label: 'Đang dùng', icon: '🔴' },
    ];

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải danh sách bàn...</p>
            </div>
        );
    }

    return (
        <div className="tables-page">
            <div className="container tables-container">
                <section className="tables-hero">
                    <div className="tables-hero-content">
                        <span className="tables-kicker">Trung tâm đặt bàn</span>
                        <h1>Chọn bàn yêu thích trong vài chạm</h1>
                        <p>
                            Theo dõi trạng thái theo thởi gian thực và khóa bàn phù hợp với nhóm bạn trước khi đặt món.
                            Các bàn được đồng bộ trực tiếp với khu vực căn tin.
                        </p>
                    </div>

                    <div className="tables-stats-grid">
                        <div className="tables-stat-card">
                            <span className="stat-label">Bàn trống</span>
                            <strong>{statusCounts.available}</strong>
                        </div>
                        <div className="tables-stat-card">
                            <span className="stat-label">Đã đặt</span>
                            <strong>{statusCounts.reserved}</strong>
                        </div>
                        <div className="tables-stat-card">
                            <span className="stat-label">Đang dùng</span>
                            <strong>{statusCounts.occupied}</strong>
                        </div>
                    </div>
                </section>

                <div className="tables-filter-group">
                    {statusOptions.map((option) => (
                        <button
                            key={option.key}
                            className={`tables-filter-btn ${filter === option.key ? 'active' : ''}`}
                            onClick={() => setFilter(option.key)}
                        >
                            <span className="filter-icon">{option.icon}</span>
                            <span>{option.label}</span>
                            <span className="filter-count">{statusCounts[option.key]}</span>
                        </button>
                    ))}
                </div>

                {!confirmedSlot ? (
                    <div className="tables-empty-state">
                        <div className="empty-icon">⏱️</div>
                        <h2>Hãy xác nhận khung giờ</h2>
                        <p>Chọn ngày và khung giờ phù hợp, nhấn xác nhận để xem danh sách bàn theo trạng thái.</p>
                    </div>
                ) : filteredTables.length === 0 ? (
                    <div className="tables-empty-state">
                        <div className="empty-icon">🪑</div>
                        <h2>Không tìm thấy bàn phù hợp</h2>
                        <p>Hiện chưa có bàn ở trạng thái này. Hãy xem tất cả bàn hoặc tiếp tục đặt món.</p>
                        <div className="empty-actions">
                            <button onClick={() => navigate('/menu')} className="btn-primary">
                                Đến menu
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="tables-grid">
                            {filteredTables.map((table) => (
                                <div
                                    key={table.id}
                                    className={`table-card ${selectedTableId === table.id ? 'selected' : ''} ${table.status !== 'available' ? 'disabled' : ''}`}
                                    onClick={() => handleSelectTable(table)}
                                >
                                    {selectedTableId === table.id && (
                                        <div className="table-selected-pill">
                                            <span>Đang chọn</span>
                                            <span className="checkmark">✓</span>
                                        </div>
                                    )}

                                    <div className="table-card-body">
                                        <div className="table-icon-circle">
                                            <span className="table-emoji">🪑</span>
                                        </div>

                                        <div className="table-info">
                                            <div className={`table-status-badge status-${table.status}`}>
                                                {table.status === 'available' && '✓ Trống'}
                                                {table.status === 'occupied' && '✕ Đang dùng'}
                                                {table.status === 'reserved' && '⏰ Đã đặt'}
                                            </div>
                                            <h3 className="table-number">
                                                Bàn {table.table_number || table.number}
                                            </h3>

                                            <p className="table-location">
                                                <span className="location-icon">📍</span>
                                                {table.location}
                                            </p>

                                            <div className="table-meta">
                                                <div className="meta-item">
                                                    <span className="meta-icon">👥</span>
                                                    <span className="meta-text">{table.capacity} người</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Confirm Button */}
                        {selectedTableId && (
                            <div className="table-confirm-section">
                                <div className="confirm-card">
                                    <div className="confirm-info">
                                        <span className="confirm-icon">✓</span>
                                        <div>
                                            <p className="confirm-label">Bạn đã chọn</p>
                                            <p className="confirm-table">
                                                Bàn{' '}
                                                {
                                                    filteredTables.find((t) => t.id === selectedTableId)
                                                        ?.table_number ||
                                                    filteredTables.find((t) => t.id === selectedTableId)?.number
                                                }
                                            </p>
                                            <p className="confirm-slot">Khung giờ: {confirmedSlot?.label}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleConfirmTable} className="btn-confirm-modern">
                                        Tiếp tục đặt món
                                        <span className="btn-arrow">→</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <section className="reservation-panel glass-panel">
                    <div className="reservation-header">
                        <div>
                            <p className="reservation-eyebrow">Giữ bàn theo khung giờ</p>
                            <h2>Đặt trước thởi gian đến</h2>
                        </div>
                        <div className="reservation-controls-grid">
                            <label className="control-card">
                                <div className="control-header">
                                    <span className="control-icon">📅</span>
                                    <div>
                                        <p className="control-eyebrow">Ngày</p>
                                        <p className="control-value">{formatDisplayDate(reservationDate)}</p>
                                    </div>
                                </div>
                                <div className="control-field">
                                    <input
                                        type="date"
                                        value={reservationDate}
                                        onChange={handleDateChange}
                                        className="control-input"
                                    />
                                </div>
                            </label>
                            <label className="control-card">
                                <div className="control-header">
                                    <span className="control-icon">⏱️</span>
                                    <div>
                                        <p className="control-eyebrow">Khung giờ</p>
                                        <p className="control-value">{pendingSlotId ? confirmedSlot?.label || timeSlots.find((slot) => slot.id === pendingSlotId)?.label : 'Chọn khung giờ'}</p>
                                    </div>
                                </div>
                                <div className="control-field select-field">
                                    <select
                                        value={pendingSlotId}
                                        onChange={(e) => setPendingSlotId(e.target.value)}
                                        className="control-input select-input"
                                    >
                                        <option value="">Chọn khung giờ</option>
                                        {timeSlots.map((slot) => (
                                            <option key={slot.id} value={slot.id}>
                                                {slot.label}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="select-arrow">⌄</span>
                                </div>
                            </label>
                            <label className="control-card">
                                <div className="control-header">
                                    <span className="control-icon">👥</span>
                                    <div>
                                        <p className="control-eyebrow">Số người</p>
                                        <p className="control-value">{partySize}</p>
                                    </div>
                                </div>
                                <div className="control-field">
                                    <input
                                        className="control-input"
                                        type="number"
                                        min="1"
                                        max={selectedTable?.capacity || 20}
                                        value={partySize}
                                        onChange={handlePartySizeChange}
                                    />
                                </div>
                            </label>
                            <button type="button" className="control-card confirm-control" onClick={handleConfirmWindow}>
                                <div className="confirm-glow"></div>
                                <div className="confirm-content">
                                    <span className="confirm-eyebrow">Bước kế tiếp</span>
                                    <strong>Xác nhận</strong>
                                    <p className="confirm-caption">Khóa danh sách bàn theo khung giờ này</p>
                                </div>
                                <span className="confirm-arrow">→</span>
                            </button>
                        </div>
                    </div>

                    {confirmedSlot && (
                        <div className="reservation-summary confirmed-window">
                            <div className="summary-table-card">
                                <p className="summary-label">Khung giờ đã chọn</p>
                                <strong>
                                    {reservationDate} · {confirmedSlot.label}
                                </strong>
                            </div>
                            <div className="summary-chip success">
                                Hệ thống đang hiển thị bàn cho khung giờ này
                            </div>
                        </div>
                    )}

                    {!confirmedSlot && (
                        <div className="reservation-empty">
                            <p>Hãy chọn ngày, khung giờ và nhấn xác nhận để xem danh sách bàn phù hợp.</p>
                        </div>
                    )}

                    {selectedReservation && (
                        <div className="reservation-summary">
                            <div className="summary-table-card">
                                <p className="summary-label">Khung giờ đang giữ</p>
                                <strong>
                                    {formatTimeRange(selectedReservation.start_time, selectedReservation.end_time)}
                                </strong>
                                <span>
                                    {' '}
                                    · Bàn{' '}
                                    {availableTables.find((t) => t.id === selectedReservation.table_id)?.table_number ||
                                        availableTables.find((t) => t.id === selectedReservation.table_id)?.number ||
                                        selectedReservation.table_id}
                                </span>
                            </div>
                            <button className="chip-action ghost" onClick={clearReservation}>
                                Hủy giữ bàn
                            </button>
                        </div>
                    )}
                </section>

                <section className="tables-info-panel">
                    <div className="tables-legend">
                        <h3>Chú thích trạng thái</h3>
                        <div className="legend-grid">
                            <div className="legend-item">
                                <span className="legend-indicator available"></span>
                                <span>Bàn trống - Có thể đặt</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-indicator reserved"></span>
                                <span>Đã đặt trước</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-indicator occupied"></span>
                                <span>Đang có khách</span>
                            </div>
                        </div>
                    </div>

                    <div className="tables-info-grid">
                        <div className="info-card">
                            <div className="info-icon">⏰</div>
                            <h4>Giữ bàn 15 phút</h4>
                            <p>Bàn sẽ được giữ trong 15 phút sau khi bạn xác nhận.</p>
                        </div>
                        <div className="info-card">
                            <div className="info-icon">🔔</div>
                            <h4>Thông báo theo thời gian thực</h4>
                            <p>Nhận thông báo ngay trên thiết bị khi bàn đã sẵn sàng.</p>
                        </div>
                        <div className="info-card">
                            <div className="info-icon">📱</div>
                            <h4>Đặt từ xa</h4>
                            <p>Đặt bàn trước để không phải chờ đợi vào giờ cao điểm.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TablesPage;