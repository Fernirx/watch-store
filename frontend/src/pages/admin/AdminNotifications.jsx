import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import Toast from '../../components/Toast';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'SYSTEM',
    image_url: '',
    link_url: '',
    start_at: '',
    end_at: '',
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getAllNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setToast({ message: 'Vui lòng nhập tiêu đề và nội dung', type: 'error' });
      return;
    }

    try {
      const submitData = {
        ...formData,
        start_at: formData.start_at || null,
        end_at: formData.end_at || null,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
        priority: parseInt(formData.priority) || 0,
      };

      if (editingId) {
        await notificationService.updateNotification(editingId, submitData);
        setToast({ message: 'Cập nhật thông báo thành công!', type: 'success' });
      } else {
        await notificationService.createNotification(submitData);
        setToast({ message: 'Tạo thông báo thành công!', type: 'success' });
      }

      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      setToast({ message: `Không thể ${editingId ? 'cập nhật' : 'tạo'} thông báo: ${error.response?.data?.message || error.message}`, type: 'error' });
    }
  };

  const handleEdit = (notification) => {
    setEditingId(notification.id);
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      image_url: notification.image_url || '',
      link_url: notification.link_url || '',
      start_at: notification.start_at ? new Date(notification.start_at).toISOString().slice(0, 16) : '',
      end_at: notification.end_at ? new Date(notification.end_at).toISOString().slice(0, 16) : '',
      is_active: notification.is_active,
      priority: notification.priority || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
      return;
    }

    try {
      await notificationService.deleteNotification(id);
      fetchNotifications();
      setToast({ message: 'Xóa thông báo thành công!', type: 'success' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setToast({ message: 'Không thể xóa thông báo', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'SYSTEM',
      image_url: '',
      link_url: '',
      start_at: '',
      end_at: '',
      is_active: true,
      priority: 0,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      SYSTEM: { label: 'Hệ thống', class: 'badge-info' },
      PROMOTION: { label: 'Khuyến mãi', class: 'badge-danger' },
      MAINTENANCE: { label: 'Bảo trì', class: 'badge-warning' },
      FEATURE: { label: 'Tính năng', class: 'badge-success' },
    };
    const typeInfo = typeMap[type] || { label: type, class: 'badge-secondary' };
    return <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>;
  };

  const getStatus = (notification) => {
    if (!notification.is_active) {
      return <span className="badge badge-secondary">Đã tắt</span>;
    }

    const now = new Date();
    if (notification.start_at && new Date(notification.start_at) > now) {
      return <span className="badge badge-info">Chưa bắt đầu</span>;
    }
    if (notification.end_at && new Date(notification.end_at) < now) {
      return <span className="badge badge-danger">Đã hết hạn</span>;
    }

    return <span className="badge badge-success">Đang hiển thị</span>;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải thông báo...</p>
      </div>
    );
  }

  return (
    <div className="admin-notifications">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>Quản Lý Thông Báo</h1>
          <div className="admin-breadcrumb">
            <Link to="/admin">Dashboard</Link>
            <span>/</span>
            <span>Thông báo</span>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
          Thêm Thông Báo
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForm()}>
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Sửa Thông Báo' : 'Thêm Thông Báo Mới'}</h2>
              <button onClick={resetForm} className="modal-close">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title" className="required">Tiêu đề</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="form-control"
                    placeholder="Nhập tiêu đề thông báo..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="content" className="required">Nội dung</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="form-control"
                    placeholder="Nhập nội dung thông báo..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="type" className="required">Loại thông báo</label>
                    <select id="type" name="type" value={formData.type} onChange={handleChange} className="form-control">
                      <option value="SYSTEM">Hệ thống</option>
                      <option value="PROMOTION">Khuyến mãi</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                      <option value="FEATURE">Tính năng mới</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="priority">Độ ưu tiên (càng cao càng lên đầu)</label>
                    <input
                      type="number"
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="form-control"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="image_url">URL hình ảnh</label>
                  <input
                    type="text"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="link_url">URL liên kết (nếu có)</label>
                  <input
                    type="text"
                    id="link_url"
                    name="link_url"
                    value={formData.link_url}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="https://example.com/promo"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="start_at">Hiển thị từ</label>
                    <input
                      type="datetime-local"
                      id="start_at"
                      name="start_at"
                      value={formData.start_at}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_at">Hiển thị đến</label>
                    <input
                      type="datetime-local"
                      id="end_at"
                      name="end_at"
                      value={formData.end_at}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Kích hoạt thông báo</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={resetForm} className="btn btn-secondary">Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Loại</th>
              <th>Ưu tiên</th>
              <th>Thời gian hiển thị</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔔</div>
                    <h3>Chưa có thông báo nào</h3>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
                      Thêm Thông Báo
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              notifications.map((notification) => (
                <tr key={notification.id}>
                  <td>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{notification.title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {notification.content.substring(0, 80)}
                      {notification.content.length > 80 && '...'}
                    </div>
                  </td>
                  <td>{getTypeBadge(notification.type)}</td>
                  <td>
                    <span style={{ fontWeight: '700', color: notification.priority > 0 ? '#dc2626' : '#64748b' }}>
                      {notification.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem' }}>
                      {notification.start_at && (
                        <div>Từ: {new Date(notification.start_at).toLocaleString('vi-VN')}</div>
                      )}
                      {notification.end_at && (
                        <div>Đến: {new Date(notification.end_at).toLocaleString('vi-VN')}</div>
                      )}
                      {!notification.start_at && !notification.end_at && (
                        <span style={{ color: '#94a3b8' }}>Không giới hạn</span>
                      )}
                    </div>
                  </td>
                  <td>{getStatus(notification)}</td>
                  <td>
                    <div className="table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(notification)} className="btn-icon edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDelete(notification.id)} className="btn-icon delete">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminNotifications;
