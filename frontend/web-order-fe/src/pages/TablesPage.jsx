import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableStore } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';

const TablesPage = () => {
    const navigate = useNavigate();
    const { availableTables, fetchAvailableTables, selectTable, isLoading } = useTableStore();
    const { isAuthenticated } = useAuthStore();
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadTables();
    }, [isAuthenticated]);

    const loadTables = async () => {
        await fetchAvailableTables();
    };

    const handleSelectTable = (table) => {
        if (table.status === 'available') {
            setSelectedTableId(table.id);
        }
    };

    const handleConfirmTable = () => {
        const table = availableTables.find(t => t.id === selectedTableId);
        if (table) {
            selectTable(table);
            navigate('/menu');
        }
    };

    const filteredTables = availableTables.filter(table => {
        if (filter === 'all') return true;
        return table.status === filter;
    });

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
            <div className="container">
                {/* Page Header */}
                <div className="page-header">
                    <h1 className="page-title">
                        <span className="title-icon">🪑</span>
                        Chọn bàn
                    </h1>
                    <p className="page-subtitle">
                        Chúng tôi có {availableTables.filter(t => t.status === 'available').length} bàn trống
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="table-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <span className="filter-icon">📋</span>
                        Tất cả
                        <span className="filter-count">{availableTables.length}</span>
                    </button>
                    <button
                        className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
                        onClick={() => setFilter('available')}
                    >
                        <span className="filter-icon">✅</span>
                        Bàn trống
                        <span className="filter-count">{availableTables.filter(t => t.status === 'available').length}</span>
                    </button>
                    <button
                        className={`filter-btn ${filter === 'reserved' ? 'active' : ''}`}
                        onClick={() => setFilter('reserved')}
                    >
                        <span className="filter-icon">⏰</span>
                        Đã đặt
                        <span className="filter-count">{availableTables.filter(t => t.status === 'reserved').length}</span>
                    </button>
                    <button
                        className={`filter-btn ${filter === 'occupied' ? 'active' : ''}`}
                        onClick={() => setFilter('occupied')}
                    >
                        <span className="filter-icon">🔴</span>
                        Đang dùng
                        <span className="filter-count">{availableTables.filter(t => t.status === 'occupied').length}</span>
                    </button>
                </div>

                {filteredTables.length === 0 ? (
                    <div className="no-tables-card">
                        <div className="no-tables-icon">🪑</div>
                        <h2 className="no-tables-title">Không có bàn {filter === 'available' ? 'trống' : ''}</h2>
                        <p className="no-tables-text">
                            Hiện tại không có bàn phù hợp. Vui lòng thử lại sau hoặc xem thực đơn trước.
                        </p>
                        <div className="no-tables-actions">
                            <button onClick={() => setFilter('all')} className="btn-secondary">
                                Xem tất cả bàn
                            </button>
                            <button onClick={() => navigate('/menu')} className="btn-primary">
                                Xem thực đơn
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tables Grid */}
                        <div className="tables-grid-modern">
                            {filteredTables.map((table) => (
                                <div
                                    key={table.id}
                                    className={`table-card-modern ${selectedTableId === table.id ? 'selected' : ''} ${table.status !== 'available' ? 'disabled' : ''}`}
                                    onClick={() => handleSelectTable(table)}
                                >
                                    {/* Status Badge */}
                                    <div className={`table-status-badge status-${table.status}`}>
                                        {table.status === 'available' && '✓ Trống'}
                                        {table.status === 'occupied' && '✕ Đang dùng'}
                                        {table.status === 'reserved' && '⏰ Đã đặt'}
                                    </div>

                                    {/* Selected Badge */}
                                    {selectedTableId === table.id && (
                                        <div className="table-selected-indicator">
                                            <span className="checkmark">✓</span>
                                        </div>
                                    )}

                                    {/* Table Icon */}
                                    <div className="table-icon-wrapper">
                                        <div className="table-icon-circle">
                                            <span className="table-emoji">🪑</span>
                                        </div>
                                    </div>

                                    {/* Table Info */}
                                    <div className="table-info-modern">
                                        <h3 className="table-number-modern">Bàn {table.number}</h3>
                                        <p className="table-location-modern">
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

                                    {/* Hover Effect */}
                                    {table.status === 'available' && (
                                        <div className="table-hover-overlay">
                                            <span className="hover-text">Chọn bàn này</span>
                                        </div>
                                    )}
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
                                                Bàn {filteredTables.find(t => t.id === selectedTableId)?.number}
                                            </p>
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

                {/* Legend */}
                <div className="table-legend-modern">
                    <h3 className="legend-title">Chú thích trạng thái</h3>
                    <div className="legend-grid">
                        <div className="legend-item-modern">
                            <span className="legend-indicator available"></span>
                            <span className="legend-text">Bàn trống - Có thể đặt</span>
                        </div>
                        <div className="legend-item-modern">
                            <span className="legend-indicator occupied"></span>
                            <span className="legend-text">Đang có khách</span>
                        </div>
                        <div className="legend-item-modern">
                            <span className="legend-indicator reserved"></span>
                            <span className="legend-text">Đã được đặt trước</span>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="table-info-cards">
                    <div className="info-card">
                        <div className="info-icon">⏰</div>
                        <h4>Giữ bàn 15 phút</h4>
                        <p>Bàn sẽ được giữ trong 15 phút sau khi đặt</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">🔔</div>
                        <h4>Thông báo ngay</h4>
                        <p>Nhận thông báo khi bàn sẵn sàng</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">📱</div>
                        <h4>Đặt trước dễ dàng</h4>
                        <p>Đặt bàn trước để không phải chờ đợi</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TablesPage;