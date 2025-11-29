import axios from '../api/axiosConfig';

const brandService = {
  // ========== PUBLIC ENDPOINTS ==========

  // Lấy tất cả thương hiệu
  getBrands: async () => {
    const response = await axios.get('/brands');
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
    // brandData: { name, description, logo (File), website, is_active }
    const formData = new FormData();

    Object.keys(brandData).forEach(key => {
      if (brandData[key] !== null && brandData[key] !== undefined) {
        formData.append(key, brandData[key]);
      }
    });

    const response = await axios.post('/brands', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật thương hiệu
  updateBrand: async (id, brandData) => {
    const formData = new FormData();

    Object.keys(brandData).forEach(key => {
      if (brandData[key] !== null && brandData[key] !== undefined) {
        formData.append(key, brandData[key]);
      }
    });

    // Laravel không hỗ trợ PUT với multipart/form-data
    // Sử dụng POST với _method=PUT
    const response = await axios.post(`/brands/${id}`, formData, {
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
