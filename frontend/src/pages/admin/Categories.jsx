import { useState, useEffect } from 'react';
import categoryService from '../../services/categoryService';
import Toast from '../../components/Toast';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    image: null,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAdminCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const errors = [];

    // Validate tên danh mục
    if (!formData.name.trim()) {
      errors.push('Tên danh mục là bắt buộc');
    } else if (formData.name.trim().length < 2) {
      errors.push('Tên danh mục phải có ít nhất 2 ký tự');
    } else if (formData.name.trim().length > 100) {
      errors.push('Tên danh mục không được vượt quá 100 ký tự');
    }

    return errors;
  };

  const handleSubmit = async (e) => {

    // Validate form trước khi submit
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setToast({ message: validationErrors.join(', '), type: 'error' });
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('is_active', formData.is_active ? 1 : 0);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingId) {
        submitData.append('_method', 'PUT');
        await categoryService.updateCategory(editingId, submitData);
        setToast({ message: 'Cập nhật danh mục thành công!', type: 'success' });
      } else {
        await categoryService.createCategory(submitData);
        setToast({ message: 'Tạo danh mục thành công!', type: 'success' });
      }

      resetForm();
      fetchCategories();
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
          message: `Không thể ${editingId ? 'cập nhật' : 'tạo'} danh mục: ${error.response?.data?.message || error.message}`,
          type: 'error'
        });
      }
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active ?? true,
      image: null,
    });
    setImagePreview(category.image_url);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await categoryService.deleteCategory(deleteId);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchCategories();
      setToast({ message: 'Xóa danh mục thành công!', type: 'success' });
    } catch (error) {
      console.error('Error deleting category:', error);
      setToast({ message: 'Không thể xóa danh mục', type: 'error' });
    }
  };


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      image: null
    });
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải danh mục...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1> Quản Lý Danh Mục</h1>
          <div className="admin-breadcrumb">
            <a href="/admin">Dashboard</a>
            <span>/</span>
            <span>Danh mục</span>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          Thêm Danh Mục Mới
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForm()}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? ' Sửa Danh Mục' : ' Thêm Danh Mục Mới'}</h2>
              <button onClick={resetForm} className="modal-close">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowUpdateConfirm(true);
              }}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name" className="required">Tên danh mục</label>
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
                    className="form-control"
                    placeholder="Nhập tên danh mục..."
                  />
                  {fieldErrors.name ? (
                    <small className="error-message">{fieldErrors.name}</small>
                  ) : null}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Mô tả</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="form-control"
                    placeholder="Nhập mô tả danh mục..."
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          is_active: e.target.checked
                        }))
                      }
                    />
                    <span>Trạng thái hiển thị</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="image">Hình ảnh</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="form-control"
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '1rem' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '0.5rem',
                          border: '2px solid #e2e8f0'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingId ? ' Cập nhật' : ' Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {categories.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon"></div>
            <h3>Chưa có danh mục nào</h3>
            <p>Hãy tạo danh mục đầu tiên cho cửa hàng</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn btn-primary"
            >
              Thêm Danh Mục
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              style={{
                background: 'white',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {category.image_url && (
                <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                  <img
                    src={category.image_url}
                    alt={category.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                  {category.name}
                </h3>
                {category.description && (
                  <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9375rem' }}>
                    {category.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleEdit(category)}
                    className="btn-icon edit"
                    aria-label="Chỉnh sửa danh mục"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="btn-icon delete"
                    aria-label="Xóa sản phẩm"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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
              <h3>Xác nhận xóa danh mục</h3>
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
              <p>Bạn có chắc chắn muốn <strong>xóa danh mục</strong> này không?</p>
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
                Xác nhận {editingId ? 'cập nhật' : 'tạo'} danh mục
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
                Bạn có chắc chắn muốn{' '}
                <strong>{editingId ? 'cập nhật' : 'tạo mới'}</strong> danh mục này không?
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowUpdateConfirm(false);
                  setShowForm(false);        // đóng form sửa/thêm
                  setEditingId(null);        // reset trạng thái edit
                  navigate('/admin/categories');
                }}
              >
                Hủy
              </button>

              <button
                className="btn btn-success"
                onClick={async () => {
                  setShowUpdateConfirm(false);
                  await handleSubmit();
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

export default Categories;
