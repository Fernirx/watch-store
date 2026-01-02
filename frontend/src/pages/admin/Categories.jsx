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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
    e.preventDefault();

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
      console.error('Error saving category:', error);
      setToast({
        message: `Không thể ${editingId ? 'cập nhật' : 'tạo'} danh mục: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: null,
    });
    setImagePreview(category.image_url);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      fetchCategories();
      setToast({ message: 'Xóa danh mục thành công!', type: 'success' });
    } catch (error) {
      console.error('Error deleting category:', error);
      setToast({ message: 'Không thể xóa danh mục', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', image: null });
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

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name" className="required">Tên danh mục</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-control"
                    placeholder="Nhập tên danh mục..."
                  />
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
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  ✕ Hủy
                </button>
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
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                     Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1 }}
                  >
                     Xóa
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
    </div>
  );
};

export default Categories;
