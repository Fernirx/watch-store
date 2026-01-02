import axios from '../api/axiosConfig';

const categoryService = {
  // ========== PUBLIC ENDPOINTS ==========

  // Lấy tất cả danh mục
  getCategories: async () => {
    const response = await axios.get('/categories');
    return response.data;
  },

  getAdminCategories: async () => {
    const response = await axios.get('/admin/categories');
    return response.data;
  },

  // Lấy chi tiết danh mục
  getCategory: async (id) => {
    const response = await axios.get(`/categories/${id}`);
    return response.data;
  },

  // ========== ADMIN ENDPOINTS (Require auth + admin role) ==========

  // Tạo danh mục mới
  createCategory: async (categoryData) => {
    const response = await axios.post('/categories', categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật danh mục
  updateCategory: async (id, categoryData) => {
    // Laravel không hỗ trợ PUT với multipart/form-data
    // Sử dụng POST với _method=PUT
    const response = await axios.post(`/categories/${id}`, categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa danh mục
  deleteCategory: async (id) => {
    const response = await axios.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryService;
