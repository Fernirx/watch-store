import axios from '../api/axiosConfig';

const userService = {
  // ========== ADMIN ENDPOINTS (Require auth + admin role) ==========

  // Lấy danh sách users với filtering, search, và pagination
  getUsers: async (params = {}) => {
    // params: { role, is_active, search, sort_by, sort_order, per_page, page }
    const response = await axios.get('/users', { params });
    return response.data;
  },

  // Lấy chi tiết user
  getUser: async (id) => {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  },

  // Tạo user mới
  createUser: async (userData) => {
    // userData: { name, email, password, phone, role, is_active, avatar (File) }
    const formData = new FormData();

    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        // Convert boolean to integer for Laravel
        if (key === 'is_active') {
          formData.append(key, userData[key] ? '1' : '0');
        } else {
          formData.append(key, userData[key]);
        }
      }
    });

    const response = await axios.post('/users', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật user
  updateUser: async (id, userData) => {
    const formData = new FormData();

    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        // Convert boolean to integer for Laravel
        if (key === 'is_active') {
          formData.append(key, userData[key] ? '1' : '0');
        } else {
          formData.append(key, userData[key]);
        }
      }
    });

    // Laravel không hỗ trợ PUT với multipart/form-data
    // Sử dụng POST với _method=PUT
    formData.append('_method', 'PUT');

    const response = await axios.post(`/users/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa user
  deleteUser: async (id) => {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  },

  // Toggle trạng thái active/inactive của user
  toggleUserStatus: async (id) => {
    const response = await axios.patch(`/users/${id}/toggle-status`);
    return response.data;
  },
};

export default userService;
