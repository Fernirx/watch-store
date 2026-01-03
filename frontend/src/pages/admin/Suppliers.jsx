import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supplierService from '../../services/supplierService';
import Toast from '../../components/Toast';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierService.getSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {

    if (!formData.name.trim()) {
      setToast({ message: 'Vui lòng nhập tên nhà cung cấp', type: 'error' });
      return;
    }

    try {
      if (editingId) {
        await supplierService.updateSupplier(editingId, formData);
        setToast({ message: 'Cập nhật nhà cung cấp thành công!', type: 'success' });
      } else {
        await supplierService.createSupplier(formData);
        setToast({ message: 'Tạo nhà cung cấp thành công!', type: 'success' });
      }
      resetForm();
      fetchSuppliers();
    } catch (error) {
      if (error.response?.status === 422) {
        const { message, fields, errors } = error.response.data;

        // Set error toast with clear message
        setToast({ message: message || 'Dữ liệu không hợp lệ', type: 'error' });

        // Set field-level errors for inline display
        if (fields) {
          setFieldErrors({ [fields]: message });
        } else if (errors) {
          // Convert errors object to fieldErrors format
          const formattedErrors = {};
          Object.keys(errors).forEach(key => {
            formattedErrors[key] = errors[key][0]; // Get first error message
          });
          setFieldErrors(formattedErrors);
        }
      } else {
        console.error('Error saving category:', error);
        setToast({
          message: `Không thể ${editingId ? 'cập nhật' : 'tạo'} nhà cung cấp: ${error.response?.data?.message || error.message}`,
          type: 'error'
        });
      }
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      is_active: supplier.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await supplierService.deleteSupplier(deleteId);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchSuppliers();
      setToast({ message: 'Xóa nhà cung cấp thành công!', type: 'success' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setToast({ message: 'Không thể xóa nhà cung cấp', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div><p>Đang tải...</p></div>;
  }

  return (
    <div className="admin-suppliers">
      <div className="admin-page-header">
        <div>
          <h1>Quản Lý Nhà Cung Cấp</h1>
          <div className="admin-breadcrumb">
            <Link to="/admin">Dashboard</Link>
            <span>/</span>
            <span>Nhà cung cấp</span>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
          Thêm Nhà Cung Cấp Mới
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForm()}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'}</h2>
              <button onClick={resetForm} className="modal-close">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowUpdateConfirm(true);
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name" className="required">Tên nhà cung cấp</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={
                      (e) => {
                        handleChange(e);
                        if (fieldErrors.name) {
                          setFieldErrors(prev => ({ ...prev, name: null }));
                        }
                      }
                    }
                    required
                    className="form-control" />
                  {fieldErrors.name ? (
                    <small className="error-message">{fieldErrors.name}</small>
                  ) : null}
                </div>
                <div className="form-group">
                  <label htmlFor="contact_person">Người liên hệ</label>
                  <input type="text" id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleChange} className="form-control" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="form-control" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Địa chỉ</label>
                  <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="3" className="form-control" />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                    <span>Trạng thái hiển thị</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Người liên hệ</th>
              <th>Liên lạc</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🏢</div>
                    <h3>Chưa có nhà cung cấp nào</h3>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">Thêm Nhà Cung Cấp</button>
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td><strong>{supplier.name}</strong></td>
                  <td>{supplier.contact_person || '-'}</td>
                  <td>
                    {supplier.phone && <div>{supplier.phone}</div>}
                    {supplier.email && <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{supplier.email}</div>}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{supplier.address || '-'}</td>
                  <td>
                    <span className={`badge ${supplier.is_active ? 'badge-success' : 'badge-secondary'}`}>
                      {supplier.is_active ? 'Hoạt động' : 'Dừng'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(supplier)} className="btn-icon edit"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(supplier.id)} className="btn-icon delete"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Xác nhận xóa nhà cung cấp</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>Bạn có chắc chắn muốn <strong>xóa nhà cung cấp</strong> này không?</p>
              <p style={{ color: '#991b1b', fontWeight: 600 }}>
                Hành động này không thể hoàn tác!
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
              >
                Hủy
              </button>

              <button
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      {showUpdateConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>
                Xác nhận {editingId ? 'cập nhật' : 'tạo'} nhà cung cấp
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowUpdateConfirm(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn <strong>{editingId ? 'cập nhật' : 'tạo mới'}</strong> nhà cung cấp này không?
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowUpdateConfirm(false);
                  setShowForm(false);        // đóng form sửa/thêm
                  setEditingId(null);        // reset trạng thái edit
                  navigate('/admin/suppliers'); // đổi path cho đúng
                }}
              >
                Hủy
              </button>

              <button
                className="btn btn-success"
                onClick={async () => {
                  setShowUpdateConfirm(false);
                  await handleSubmit(); // vẫn giữ logic submit cũ
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
