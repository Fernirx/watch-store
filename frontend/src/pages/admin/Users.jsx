import { useState, useEffect } from 'react';
import userService from '../../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    shipping_phone: '',
    role: 'USER',
    is_active: true,
    avatar: null,
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers(filters);
      console.log('Users response:', response);
      console.log('response.data:', response.data);
      console.log('response.data.data:', response.data.data);

      // Backend trả về pagination: response.data.data có thể là object với key 'data'
      const paginationData = response.data?.data;

      // Nếu có pagination (Laravel paginate)
      if (paginationData && typeof paginationData === 'object' && 'data' in paginationData) {
        console.log('Using pagination data:', paginationData.data);
        setUsers(Array.isArray(paginationData.data) ? paginationData.data : []);
      }
      // Nếu trả về array trực tiếp
      else if (Array.isArray(paginationData)) {
        console.log('Using array data:', paginationData);
        setUsers(paginationData);
      }
      // Fallback
      else {
        console.log('No valid data found');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Không thể tải danh sách người dùng: ' + (error.response?.data?.message || error.message));
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = [];

    // Validate tên
    if (!formData.name.trim()) {
      errors.push('Tên là bắt buộc');
    } else if (formData.name.trim().length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự');
    } else if (formData.name.trim().length > 100) {
      errors.push('Tên không được vượt quá 100 ký tự');
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.push('Email là bắt buộc');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Email không hợp lệ');
    }

    // Validate password (chỉ khi tạo mới hoặc khi có nhập password)
    if (!editingId && !formData.password) {
      errors.push('Mật khẩu là bắt buộc khi tạo user mới');
    }
    if (formData.password && formData.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Validate shipping_phone nếu có
    if (formData.shipping_phone && !/^[0-9]{10,15}$/.test(formData.shipping_phone.replace(/\s/g, ''))) {
      errors.push('Số điện thoại giao hàng phải có 10-15 chữ số');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form trước khi submit
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert('Lỗi validation:\n' + validationErrors.join('\n'));
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        shipping_phone: formData.shipping_phone || '',
        role: formData.role,
        is_active: formData.is_active,
      };

      // Chỉ gửi password nếu có giá trị
      if (formData.password) {
        submitData.password = formData.password;
      }

      // Chỉ gửi avatar nếu có file mới
      if (formData.avatar) {
        submitData.avatar = formData.avatar;
      }

      if (editingId) {
        await userService.updateUser(editingId, submitData);
        alert('Cập nhật người dùng thành công!');
      } else {
        await userService.createUser(submitData);
        alert('Tạo người dùng thành công!');
      }

      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.errors
        ? '\n' + Object.values(error.response.data.errors).flat().join('\n')
        : '';
      alert(`Không thể ${editingId ? 'cập nhật' : 'tạo'} người dùng: ${errorMessage}${errorDetails}`);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.customer?.name || '',
      email: user.email,
      password: '', // Không hiển thị mật khẩu cũ
      shipping_phone: user.customer?.shipping_phone || '',
      role: user.role,
      is_active: user.is_active,
      avatar: null,
    });
    setAvatarPreview(user.avatar_url);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      return;
    }

    try {
      await userService.deleteUser(id);
      fetchUsers();
      alert('Xóa người dùng thành công!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await userService.toggleUserStatus(id);
      fetchUsers();
      alert('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      shipping_phone: '',
      role: 'USER',
      is_active: true,
      avatar: null,
    });
    setAvatarPreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải người dùng...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>👥 Quản Lý Người Dùng</h1>
          <div className="admin-breadcrumb">
            <a href="/admin">Dashboard</a>
            <span>/</span>
            <span>Người dùng</span>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          Thêm Người Dùng Mới
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>
              Tìm kiếm
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Tên hoặc email..."
              className="form-control"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>
              Vai trò
            </label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">Tất cả</option>
              <option value="USER">Khách hàng</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>
              Trạng thái
            </label>
            <select
              name="is_active"
              value={filters.is_active}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">Tất cả</option>
              <option value="1">Hoạt động</option>
              <option value="0">Không hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForm()}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? '✏️ Sửa Người Dùng' : '➕ Thêm Người Dùng Mới'}</h2>
              <button onClick={resetForm} className="modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name" className="required">Tên</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-control"
                    placeholder="Nhập tên người dùng..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="required">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-control"
                    placeholder="Nhập email..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className={!editingId ? 'required' : ''}>
                    Mật khẩu {editingId && '(để trống nếu không đổi)'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingId}
                    className="form-control"
                    placeholder="Nhập mật khẩu..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shipping_phone">Số điện thoại giao hàng</label>
                  <input
                    type="tel"
                    id="shipping_phone"
                    name="shipping_phone"
                    value={formData.shipping_phone}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Nhập số điện thoại giao hàng..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="required">Vai trò</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    <option value="USER">Khách hàng</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="avatar">Ảnh đại diện</label>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="form-control"
                  />
                  {avatarPreview && (
                    <div style={{ marginTop: '1rem' }}>
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '2px solid #e2e8f0'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      style={{ width: '1.25rem', height: '1.25rem' }}
                    />
                    <span>Tài khoản hoạt động</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  ✕ Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? '✓ Cập nhật' : '✓ Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>Chưa có người dùng nào</h3>
            <p>Hãy thêm người dùng đầu tiên</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn btn-primary"
            >
              Thêm Người Dùng
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                  Avatar
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                  Tên
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                  Email
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                  SĐT giao hàng
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                  Vai trò
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                  Trạng thái
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '700', color: '#475569' }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.customer?.name || 'User'}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        👤
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>{user.customer?.name || '-'}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{user.email}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>{user.customer?.shipping_phone || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      background: user.role === 'ADMIN' ? '#fef3c7' : '#dbeafe',
                      color: user.role === 'ADMIN' ? '#92400e' : '#1e40af'
                    }}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Khách hàng'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        background: user.is_active ? '#dcfce7' : '#fee2e2',
                        color: user.is_active ? '#166534' : '#991b1b'
                      }}
                    >
                      {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </button>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        className="btn btn-secondary btn-sm"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Users;
