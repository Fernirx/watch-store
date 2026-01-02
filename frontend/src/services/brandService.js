import axios from '../api/axiosConfig';

const brandService = {
  // ========== PUBLIC ENDPOINTS ==========

  // Lấy tất cả thương hiệu
  getBrands: async () => {
    const response = await axios.get('/brands');
    return response.data;
  },

  getAdminBrands: async () => {
    const response = await axios.get('/admin/brands');
    return response.data;
  },

  // Lấy chi tiết thương hiệu
  getBrand: async (id) => {
    const response = await axios.get(`/brands/${id}`);
    return response.data;
  },

  // ========== ADMIN ENDPOINTS (Require auth + admin role) ==========

  // Tạo thương hiệu mới
  createBrand: async (brandData) => {
    const response = await axios.post('/brands', brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật thương hiệu
  updateBrand: async (id, brandData) => {
    // Laravel không hỗ trợ PUT với multipart/form-data
    // Sử dụng POST với _method=PUT
    const response = await axios.post(`/brands/${id}`, brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa thương hiệu
  deleteBrand: async (id) => {
    const response = await axios.delete(`/brands/${id}`);
    return response.data;
  },
};

export default brandService;
