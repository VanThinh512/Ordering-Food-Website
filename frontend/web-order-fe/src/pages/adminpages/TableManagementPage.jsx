import { useEffect, useMemo, useState } from 'react';
import tableService from '../../services/Table';

const TableManagementPage = () => {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [formData, setFormData] = useState({
        table_number: '',
        location: '',
        capacity: 4,
        status: 'available',
    });

    const getApiErrorMessage = (error) => {
        const detail = error?.response?.data?.detail;
        if (!detail) return 'Có lỗi xảy ra, vui lòng thử lại.';
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            return detail.map((issue) => issue.msg || JSON.stringify(issue)).join('\n');
        }
        try {
            return JSON.stringify(detail);
        } catch {
            return 'Có lỗi xảy ra, vui lòng thử lại.';
        }
    };

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await tableService.getAll();
            setTables(data);
        } catch (err) {
            console.error('Không thể tải danh sách bàn', err);
            setError('Không thể tải danh sách bàn. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (table = null) => {
        if (table) {
            setEditingTable(table);
            setFormData({
                table_number: table.table_number,
                location: table.location,
                capacity: table.capacity,
                status: table.status,
            });
        } else {
            setEditingTable(null);
            setFormData({
                table_number: '',
                location: '',
                capacity: 4,
                status: 'available',
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTable(null);
        setFormData({
            table_number: '',
            location: '',
            capacity: 4,
            status: 'available',
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'capacity' ? Number(value) : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingTable) {
                await tableService.update(editingTable.id, formData);
                alert('Cập nhật bàn thành công!');
            } else {
                await tableService.create(formData);
                alert('Thêm bàn mới thành công!');
            }
            handleCloseModal();
            loadTables();
        } catch (error) {
            alert(getApiErrorMessage(error));
        }
    };

    const handleDelete = async (tableId) => {
        if (!confirm('Bạn có chắc muốn xóa bàn này?')) return;

        try {
            await tableService.delete(tableId);
            alert('Xóa bàn thành công!');
            loadTables();
        } catch (error) {
            alert(getApiErrorMessage(error));
        }
    };

    const statusCounts = useMemo(() => {
        return {
            total: tables.length,
            available: tables.filter((t) => t.status === 'available').length,
            reserved: tables.filter((t) => t.status === 'reserved').length,
            occupied: tables.filter((t) => t.status === 'occupied').length,
        };
    }, [tables]);

    const totalSeats = useMemo(
        () => tables.reduce((sum, table) => sum + (table.capacity || 0), 0),
        [tables]
    );

    const tableStats = [
        {
            label: 'Tổng số bàn',
            value: statusCounts.total,
            meta: '+2 so với tuần trước',
            accent: 'accent-green',
        },
        {
            label: 'Bàn đang dùng',
            value: statusCounts.occupied,
            meta: 'Cần theo dõi',
            accent: 'accent-red',
        },
        {
            label: 'Bàn đã đặt',
            value: statusCounts.reserved,
            meta: 'Đang chờ khách',
            accent: 'accent-orange',
        },
        {
            label: 'Ghế khả dụng',
            value: totalSeats,
            meta: 'Tổng sức chứa',
            accent: 'accent-cyan',
        },
    ];

    const getStatusBadgeClass = (status) => {
        const classes = {
            available: 'status-available',
            occupied: 'status-occupied',
            reserved: 'status-reserved',
        };
        return classes[status] || '';
    };

    const getStatusLabel = (status) => {
        const labels = {
            available: 'Trống',
            occupied: 'Đang dùng',
            reserved: 'Đã đặt',
        };
        return labels[status] || status;
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loading-container">
                <p>{error}</p>
                <button className="btn-primary" onClick={loadTables}>
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="table-management-page">
            <div className="tables-admin-hero">
                <div>
                    <p className="dashboard-eyebrow">Điều phối khu vực ăn uống</p>
                    <h1>Quản lý bàn ăn</h1>
                    <p>Giám sát trạng thái bàn, thêm bàn mới và tối ưu lưu lượng khách theo thời gian thực.</p>
                    <div className="hero-actions">
                        <button onClick={() => handleOpenModal()} className="btn-primary">
                            + Thêm bàn mới
                        </button>
                        <span className="hero-subtext">
                            {statusCounts.available} bàn trống • {statusCounts.reserved} đã đặt
                        </span>
                    </div>
                </div>
                <div className="tables-admin-hero-card">
                    <p>Trạng thái hệ thống</p>
                    <h3>{statusCounts.total || 0} bàn</h3>
                    <div className="hero-card-status">
                        <span>Đang dùng: {statusCounts.occupied}</span>
                        <span>Đã đặt: {statusCounts.reserved}</span>
                        <span>Trống: {statusCounts.available}</span>
                    </div>
                </div>
            </div>

            <div className="table-stats-grid">
                {tableStats.map((stat) => (
                    <div key={stat.label} className={`table-stat-card ${stat.accent}`}>
                        <p>{stat.label}</p>
                        <h3>{stat.value}</h3>
                        <span>{stat.meta}</span>
                    </div>
                ))}
            </div>

            <div className="tables-admin-content">
                <section className="tables-admin-panel table-list-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Danh sách bàn</h3>
                            <p>Hiển thị thông tin vị trí, sức chứa và trạng thái cập nhật.</p>
                        </div>
                        <button className="btn-secondary" onClick={loadTables}>
                            Làm mới
                        </button>
                    </div>
                    <div className="responsive-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Số bàn</th>
                                    <th>Vị trí</th>
                                    <th>Sức chứa</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tables.map((table) => (
                                    <tr key={table.id}>
                                        <td>
                                            <strong>Bàn {table.table_number}</strong>
                                        </td>
                                        <td>{table.location || '—'}</td>
                                        <td>{table.capacity} người</td>
                                        <td>
                                            <span className={`status-pill ${getStatusBadgeClass(table.status)}`}>
                                                {getStatusLabel(table.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleOpenModal(table)}
                                                    className="btn-edit"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(table.id)}
                                                    className="btn-delete"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tables.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="table-empty-state">
                                                <p>Chưa có bàn nào. Hãy thêm bàn mới để bắt đầu quản lý.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="tables-admin-panel table-form-panel">
                    <div className="panel-header">
                        <div>
                            <h3>{editingTable ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}</h3>
                            <p>Cập nhật thông tin bàn trực tiếp ngay tại bảng điều khiển.</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="inline-table-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="number-inline">Số bàn *</label>
                                <input
                                    type="text"
                                    id="number-inline"
                                    name="table_number"
                                    value={formData.table_number}
                                    onChange={handleChange}
                                    placeholder="Nhập số bàn (vd: 1, 2, A1...)"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="location-inline">Vị trí *</label>
                                <input
                                    type="text"
                                    id="location-inline"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Vd: Tầng 1, gần cửa sổ..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="capacity-inline">Sức chứa *</label>
                                <input
                                    type="number"
                                    id="capacity-inline"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    min="1"
                                    max="20"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="status-inline">Trạng thái *</label>
                                <select
                                    id="status-inline"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="available">Trống</option>
                                    <option value="occupied">Đang dùng</option>
                                    <option value="reserved">Đã đặt</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary">
                                {editingTable ? 'Lưu thay đổi' : 'Thêm mới'}
                            </button>
                            <button type="button" onClick={handleCloseModal} className="btn-secondary">
                                Hủy
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            {showModal && (
                <div className="tables-modal-overlay" onClick={handleCloseModal}>
                    <div className="tables-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="dashboard-eyebrow">
                                    {editingTable ? 'Chỉnh sửa thông tin' : 'Thêm bàn mới'}
                                </p>
                                <h2>{editingTable ? `Bàn ${editingTable.table_number}` : 'Bàn mới'}</h2>
                            </div>
                            <button onClick={handleCloseModal} className="btn-close">
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="tables-modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="number">Số bàn *</label>
                                    <input
                                        type="text"
                                        id="number"
                                        name="table_number"
                                        value={formData.table_number}
                                        onChange={handleChange}
                                        placeholder="Nhập số bàn (vd: 1, 2, A1...)"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="location">Vị trí *</label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="Vd: Tầng 1, gần cửa sổ..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="capacity">Sức chứa *</label>
                                    <input
                                        type="number"
                                        id="capacity"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        min="1"
                                        max="20"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="status">Trạng thái *</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="available">Trống</option>
                                        <option value="occupied">Đang dùng</option>
                                        <option value="reserved">Đã đặt</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions stacked">
                                <button type="submit" className="btn-primary">
                                    {editingTable ? 'Lưu thay đổi' : 'Thêm mới'}
                                </button>
                                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableManagementPage;