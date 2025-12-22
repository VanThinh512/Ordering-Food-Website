import { useEffect, useState } from 'react';
import { useTableStore } from '../../stores/tableStore';
import tableService from '../../services/Table';

const TableManagementPage = () => {
    const { tables, fetchTables, isLoading } = useTableStore();
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [formData, setFormData] = useState({
        number: '',
        location: '',
        capacity: 4,
        status: 'available',
    });

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        await fetchTables();
    };

    const handleOpenModal = (table = null) => {
        if (table) {
            setEditingTable(table);
            setFormData({
                number: table.number,
                location: table.location,
                capacity: table.capacity,
                status: table.status,
            });
        } else {
            setEditingTable(null);
            setFormData({
                number: '',
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
            number: '',
            location: '',
            capacity: 4,
            status: 'available',
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'capacity' ? parseInt(value) : value,
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
            alert(error.response?.data?.detail || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (tableId) => {
        if (confirm('Bạn có chắc muốn xóa bàn này?')) {
            try {
                await tableService.delete(tableId);
                alert('Xóa bàn thành công!');
                loadTables();
            } catch (error) {
                alert(error.response?.data?.detail || 'Không thể xóa bàn');
            }
        }
    };

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

    return (
        <div className="table-management-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Quản lý bàn</h1>
                    <button onClick={() => handleOpenModal()} className="btn-primary">
                        + Thêm bàn mới
                    </button>
                </div>

                <div className="tables-table">
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
                                        <strong>Bàn {table.number}</strong>
                                    </td>
                                    <td>{table.location}</td>
                                    <td>👥 {table.capacity} người</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(table.status)}`}>
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
                        </tbody>
                    </table>

                    {tables.length === 0 && (
                        <div className="no-data">
                            <p>Chưa có bàn nào. Hãy thêm bàn mới!</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTable ? 'Cập nhật bàn' : 'Thêm bàn mới'}</h2>
                            <button onClick={handleCloseModal} className="btn-close">
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="number">Số bàn *</label>
                                <input
                                    type="text"
                                    id="number"
                                    name="number"
                                    value={formData.number}
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
                                    placeholder="Vd: Tầng 1, Gần cửa sổ..."
                                    required
                                />
                            </div>

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

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">
                                    {editingTable ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn-secondary"
                                >
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