import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableStore } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';

const TablesPage = () => {
    const navigate = useNavigate();
    const { availableTables, fetchAllTables, selectTable, isLoading } = useTableStore();
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
        // Lấy TẤT CẢ bàn, không chỉ available
        await fetchAllTables();
    };

    const handleSelectTable = (table) => {
        // Chỉ cho phép chọn bàn available
        if (table.status === 'available') {
            setSelectedTableId(table.id);
        } else {
            alert(`Bàn này đang ở trạng thái: ${table.status === 'occupied' ? 'Đang sử dụng' :
                    table.status === 'reserved' ? 'Đã đặt trước' : table.status
                }`);
        }
    };

    const handleConfirmTable = () => {
        const table = availableTables.find(t => t.id === selectedTableId);
        if (table) {
            console.log('✅ Confirming table selection:', table);
            selectTable(table);
            navigate('/menu');
        }
    };

    const statusCounts = {
        all: availableTables.length,
        available: availableTables.filter(t => t.status === 'available').length,
        reserved: availableTables.filter(t => t.status === 'reserved').length,
        occupied: availableTables.filter(t => t.status === 'occupied').length,
    };

    const filteredTables = availableTables.filter(table => {
        if (filter === 'all') return true;
        return table.status === filter;
    });

    const statusOptions = [
        { key: 'all', label: 'Tất cả', icon: '📋' },
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
                            Theo dõi trạng thái theo thời gian thực và khóa bàn phù hợp với nhóm bạn trước khi đặt món.
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

                {filteredTables.length === 0 ? (
                    <div className="tables-empty-state">
                        <div className="empty-icon">🪑</div>
                        <h2>Không tìm thấy bàn phù hợp</h2>
                        <p>Hiện chưa có bàn ở trạng thái này. Hãy xem tất cả bàn hoặc tiếp tục đặt món.</p>
                        <div className="empty-actions">
                            <button onClick={() => setFilter('all')} className="btn-secondary">
                                Xem tất cả
                            </button>
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
                                            <h3 className="table-number">Bàn {table.number}</h3>

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
                            <h4>Thông báo theo thực gian thực</h4>
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