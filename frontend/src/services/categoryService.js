import axios from '../api/axiosConfig';

const categoryService = {
  // ========== PUBLIC ENDPOINTS ==========

  // Lấy tất cả danh mục
  getCategories: async () => {
    const response = await axios.get('/categories');
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
    // categoryData: { name, description, image (File), is_active }
    const formData = new FormData();

    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== null && categoryData[key] !== undefined) {
        formData.append(key, categoryData[key]);
      }
    });

    const response = await axios.post('/categories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật danh mục
  updateCategory: async (id, categoryData) => {
    const formData = new FormData();

    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== null && categoryData[key] !== undefined) {
        formData.append(key, categoryData[key]);
      }
    });

    // Laravel không hỗ trợ PUT với multipart/form-data
    // Sử dụng POST với _method=PUT
    const response = await axios.post(`/categories/${id}`, formData, {
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
