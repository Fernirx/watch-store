import { useState, useEffect } from 'react';
import brandService from '../../services/brandService';
import Toast from '../../components/Toast';

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    image: null,
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await brandService.getAdminBrands();
      setBrands(response.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
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

    // Validate tên thương hiệu
    if (!formData.name.trim()) {
      errors.push('Tên thương hiệu là bắt buộc');
    } else if (formData.name.trim().length < 2) {
      errors.push('Tên thương hiệu phải có ít nhất 2 ký tự');
    } else if (formData.name.trim().length > 100) {
      errors.push('Tên thương hiệu không được vượt quá 100 ký tự');
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
      submitData.append('is_active', formData.is_active ? 1 : 0);
      if (formData.image) {
        submitData.append('logo', formData.image);
      }

      if (editingId) {
        submitData.append('_method', 'PUT');
        await brandService.updateBrand(editingId, submitData);
        setToast({ message: 'Cập nhật thương hiệu thành công!', type: 'success' });
      } else {
        await brandService.createBrand(submitData);
        setToast({ message: 'Tạo thương hiệu thành công!', type: 'success' });
      }

      resetForm();
      fetchBrands();
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
          message: `Không thể ${editingId ? 'cập nhật' : 'tạo'} thương hiệu: ${error.response?.data?.message || error.message}`,
          type: 'error'
        });
      }
    }
  };

  const handleEdit = (brand) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      is_active: brand.is_active ?? true,
      image: null,
    });
    setImagePreview(brand.logo_url);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thương hiệu này?')) {
      return;
    }

    try {
      await brandService.deleteBrand(id);
      fetchBrands();
      setToast({ message: 'Xóa thương hiệu thành công!', type: 'success' });
    } catch (error) {
      console.error('Error deleting brand:', error);
      setToast({ message: 'Không thể xóa thương hiệu', type: 'error' });
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
        <p>Đang tải thương hiệu...</p>
      </div>
    );
  }

  return (
    <div className="admin-brands">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1> Quản Lý Thương Hiệu</h1>
          <div className="admin-breadcrumb">
            <a href="/admin">Dashboard</a>
            <span>/</span>
            <span>Thương hiệu</span>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          Thêm Thương Hiệu Mới
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForm()}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? ' Sửa Thương Hiệu' : ' Thêm Thương Hiệu Mới'}</h2>
              <button onClick={resetForm} className="modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name" className="required">Tên thương hiệu</label>
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
                    placeholder="Nhập tên thương hiệu..."
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
                    placeholder="Nhập mô tả thương hiệu..."
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
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
                    <span>Hiển thị thương hiệu</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="image">Logo thương hiệu</label>
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
                  {editingId ? ' Cập nhật' : '✓ Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brands Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {brands.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">⭐</div>
            <h3>Chưa có thương hiệu nào</h3>
            <p>Hãy thêm thương hiệu đầu tiên cho cửa hàng</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn btn-primary"
            >
              Thêm Thương Hiệu
            </button>
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand.id}
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
              {brand.logo_url && (
                <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                  {brand.name}
                </h3>
                {brand.description && (
                  <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9375rem' }}>
                    {brand.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleEdit(brand)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
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

export default Brands;
