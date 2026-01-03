import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import couponService from '../../services/couponService';
import Toast from '../../components/Toast';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'PERCENTAGE',
    discount_value: '',
    max_discount: '',
    min_order_value: '',
    usage_type: 'SINGLE_USE',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponService.getCoupons();
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
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

  const validateForm = () => {
    const errors = [];

    // Validate coupon code - Chỉ chữ in hoa, số, gạch ngang và gạch dưới
    if (!formData.code.trim()) {
      errors.push('Mã coupon là bắt buộc');
    } else if (formData.code.trim().length < 3) {
      errors.push('Mã coupon phải có ít nhất 3 ký tự');
    } else if (formData.code.trim().length > 50) {
      errors.push('Mã coupon không được vượt quá 50 ký tự');
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code.trim())) {
      errors.push('Mã coupon chỉ được chứa chữ in hoa, số, gạch ngang (-) và gạch dưới (_)');
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      errors.push('Giá trị giảm giá phải lớn hơn 0');
    }

    if (formData.discount_type === 'PERCENTAGE') {
      if (formData.discount_value > 100) {
        errors.push('Giảm giá phần trăm không được vượt quá 100%');
      }
    }

    if (formData.usage_type === 'LIMITED_USE') {
      if (!formData.usage_limit || formData.usage_limit <= 0) {
        errors.push('Giới hạn sử dụng là bắt buộc cho mã LIMITED_USE');
      }
    }

    if (formData.valid_from && formData.valid_until) {
      if (new Date(formData.valid_until) <= new Date(formData.valid_from)) {
        errors.push('Ngày kết thúc phải sau ngày bắt đầu');
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setToast({ message: validationErrors.join(', '), type: 'error' });
      return;
    }

    try {
      const submitData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
        usage_type: formData.usage_type,
        usage_limit: formData.usage_type === 'LIMITED_USE' ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };

      if (editingId) {
        await couponService.updateCoupon(editingId, submitData);
        setToast({ message: 'Cập nhật mã giảm giá thành công!', type: 'success' });
      } else {
        await couponService.createCoupon(submitData);
        setToast({ message: 'Tạo mã giảm giá thành công!', type: 'success' });
      }

      resetForm();
      fetchCoupons();
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
          message: `Không thể ${editingId ? 'cập nhật' : 'tạo'} mã giảm giá: ${error.response?.data?.message || error.message}`,
          type: 'error'
        });
      }
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await couponService.getCoupon(id);
      const coupon = response.data;

      setEditingId(id);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || '',
        min_order_value: coupon.min_order_value || '',
        usage_type: coupon.usage_type,
        usage_limit: coupon.usage_limit || '',
        valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] + 'T' + coupon.valid_from.split('T')[1].substring(0, 5) : '',
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] + 'T' + coupon.valid_until.split('T')[1].substring(0, 5) : '',
        is_active: coupon.is_active,
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error fetching coupon:', error);
      setToast({ message: 'Không thể tải thông tin mã giảm giá', type: 'error' });
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await couponService.deleteCoupon(deleteId);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchCoupons();
      setToast({ message: 'Xóa mã giảm giá thành công!', type: 'success' });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setToast({ message: 'Không thể xóa mã giảm giá', type: 'error' });
    }
  };


  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'PERCENTAGE',
      discount_value: '',
      max_discount: '',
      min_order_value: '',
      usage_type: 'SINGLE_USE',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.is_active) {
      return { label: 'Đã tắt', class: 'badge-secondary' };
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { label: 'Chưa bắt đầu', class: 'badge-info' };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { label: 'Đã hết hạn', class: 'badge-danger' };
    }

    // Only check usage limit for LIMITED_USE type
    if (coupon.usage_type === 'LIMITED_USE' && coupon.usage_count >= coupon.usage_limit) {
      return { label: 'Đã hết lượt', class: 'badge-secondary' };
    }

    return { label: 'Hoạt động', class: 'badge-success' };
  };

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'PERCENTAGE') {
      const maxPart = coupon.max_discount
        ? ` (tối đa ${parseFloat(coupon.max_discount).toLocaleString('vi-VN')}đ)`
        : '';
      return `${coupon.discount_value}%${maxPart}`;
    }
    return `${parseFloat(coupon.discount_value).toLocaleString('vi-VN')}đ`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải mã giảm giá...</p>
      </div>
    );
  }

  return (
    <div className="admin-coupons">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>Quản Lý Mã Giảm Giá</h1>
          <div className="admin-breadcrumb">
            <Link to="/admin">Dashboard</Link>
            <span>/</span>
            <span>Mã giảm giá</span>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          Thêm Mã Giảm Giá Mới
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForm()}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingId ? 'Sửa Mã Giảm Giá' : 'Thêm Mã Giảm Giá Mới'}</h2>
              <button onClick={resetForm} className="modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setShowUpdateConfirm(true);
            }}>
              <div className="modal-body">
                {/* Code */}
                <div className="form-group">
                  <label htmlFor="code" className="required">
                    Mã coupon
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={
                      (e) => {
                        handleChange(e);
                        if (fieldErrors.code) {
                          setFieldErrors(prev => ({ ...prev, code: null }));
                        }
                      }
                    }
                    required
                    className="form-control"
                    placeholder="VD: SUMMER2025"
                    style={{ textTransform: 'uppercase' }}
                    maxLength="50"
                  />
                  {fieldErrors.code ? (
                    <small className="error-message">{fieldErrors.code}</small>
                  ) : null}
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description">Mô tả</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    className="form-control"
                    placeholder="Mô tả ngắn về mã giảm giá..."
                  />
                </div>

                {/* Discount Type & Value */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="discount_type" className="required">
                      Loại giảm giá
                    </label>
                    <select
                      id="discount_type"
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleChange}
                      className="form-control"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount_value" className="required">
                      Giá trị giảm
                    </label>
                    <input
                      type="number"
                      id="discount_value"
                      name="discount_value"
                      value={formData.discount_value}
                      onChange={handleChange}
                      required
                      className="form-control"
                      placeholder={formData.discount_type === 'PERCENTAGE' ? '0-100' : 'VNĐ'}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Max Discount & Min Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {formData.discount_type === 'PERCENTAGE' && (
                    <div className="form-group">
                      <label htmlFor="max_discount">Giảm tối đa (đ)</label>
                      <input
                        type="number"
                        id="max_discount"
                        name="max_discount"
                        value={formData.max_discount}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Không giới hạn"
                        min="0"
                        step="1000"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="min_order_value">Đơn tối thiểu (đ)</label>
                    <input
                      type="number"
                      id="min_order_value"
                      name="min_order_value"
                      value={formData.min_order_value}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>

                {/* Usage Type & Limit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="usage_type" className="required">
                      Loại sử dụng
                    </label>
                    <select
                      id="usage_type"
                      name="usage_type"
                      value={formData.usage_type}
                      onChange={handleChange}
                      className="form-control"
                    >
                      <option value="SINGLE_USE">Dùng 1 lần</option>
                      <option value="LIMITED_USE">Giới hạn số lần</option>
                    </select>
                  </div>

                  {formData.usage_type === 'LIMITED_USE' && (
                    <div className="form-group">
                      <label htmlFor="usage_limit" className="required">
                        Giới hạn sử dụng
                      </label>
                      <input
                        type="number"
                        id="usage_limit"
                        name="usage_limit"
                        value={formData.usage_limit}
                        onChange={handleChange}
                        required={formData.usage_type === 'LIMITED_USE'}
                        className="form-control"
                        placeholder="Số lần"
                        min="1"
                      />
                    </div>
                  )}
                </div>

                {/* Valid From & Until */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="valid_from">Hiệu lực từ</label>
                    <input
                      type="datetime-local"
                      id="valid_from"
                      name="valid_from"
                      value={formData.valid_from}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="valid_until">Hiệu lực đến</label>
                    <input
                      type="datetime-local"
                      id="valid_until"
                      name="valid_until"
                      value={formData.valid_until}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Kích hoạt mã giảm giá</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại</th>
              <th>Giảm giá</th>
              <th>Đơn tối thiểu</th>
              <th>Sử dụng</th>
              <th>Trạng thái</th>
              <th>Hiệu lực</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🎟️</div>
                    <h3>Chưa có mã giảm giá nào</h3>
                    <p>Hãy tạo mã giảm giá đầu tiên</p>
                    <button
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                      className="btn btn-primary"
                    >
                      Thêm Mã Giảm Giá
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <tr key={coupon.id}>
                    {/* Code */}
                    <td>
                      <div style={{ fontWeight: '700', color: '#4f46e5', fontSize: '0.9375rem' }}>
                        {coupon.code}
                      </div>
                      {coupon.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {coupon.description}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td>
                      <span
                        className={
                          coupon.discount_type === 'PERCENTAGE' ? 'badge badge-info' : 'badge badge-primary'
                        }
                      >
                        {coupon.discount_type === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
                      </span>
                    </td>

                    {/* Discount */}
                    <td>
                      <div style={{ fontWeight: '600', color: '#dc2626' }}>{formatDiscount(coupon)}</div>
                    </td>

                    {/* Min Order */}
                    <td>
                      {coupon.min_order_value > 0
                        ? `${parseFloat(coupon.min_order_value).toLocaleString('vi-VN')}đ`
                        : '-'}
                    </td>

                    {/* Usage */}
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '700' }}>{coupon.usage_count}</span>
                        {coupon.usage_type === 'LIMITED_USE' && (
                          <span style={{ color: '#64748b' }}> / {coupon.usage_limit}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                        {coupon.usage_type === 'SINGLE_USE' ? 'Dùng 1 lần' : 'Giới hạn'}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${status.class}`}>{status.label}</span>
                    </td>

                    {/* Valid Period */}
                    <td>
                      <div style={{ fontSize: '0.75rem' }}>
                        {coupon.valid_from && (
                          <div style={{ color: '#64748b' }}>
                            Từ: {new Date(coupon.valid_from).toLocaleString('vi-VN')}
                          </div>
                        )}
                        {coupon.valid_until && (
                          <div style={{ color: '#64748b' }}>
                            Đến: {new Date(coupon.valid_until).toLocaleString('vi-VN')}
                          </div>
                        )}
                        {!coupon.valid_from && !coupon.valid_until && (
                          <span style={{ color: '#94a3b8' }}>Không giới hạn</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(coupon.id)}
                          className="btn-icon edit"
                          aria-label="Chỉnh sửa"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.usage_count)}
                          className="btn-icon delete"
                          aria-label="Xóa"
                          disabled={coupon.usage_count > 0}
                          style={{
                            opacity: coupon.usage_count > 0 ? 0.5 : 1,
                            cursor: coupon.usage_count > 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
              <h3>Xác nhận xóa mã giảm giá</h3>
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
              <p>Bạn có chắc chắn muốn <strong>xóa mã giảm giá</strong> này không?</p>
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
                Xác nhận {editingId ? 'cập nhật' : 'tạo'} mã giảm giá
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
                Bạn có chắc chắn muốn <strong>{editingId ? 'cập nhật' : 'tạo mới'}</strong> mã giảm giá này không?
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowUpdateConfirm(false);
                  setShowForm(false);        // đóng form sửa/thêm
                  setEditingId(null);        // reset trạng thái edit
                  navigate('/admin/coupons'); // đổi path cho đúng
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

export default Coupons;
