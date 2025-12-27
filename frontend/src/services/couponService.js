import axios from '../api/axiosConfig';

const couponService = {
  // ========== ADMIN ENDPOINTS ==========

  getCoupons: async () => {
    const response = await axios.get('/coupons');
    return response.data;
  },

  getCoupon: async (id) => {
    const response = await axios.get(`/coupons/${id}`);
    return response.data;
  },

  createCoupon: async (couponData) => {
    const response = await axios.post('/coupons', couponData);
    return response.data;
  },

  updateCoupon: async (id, couponData) => {
    const response = await axios.put(`/coupons/${id}`, couponData);
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await axios.delete(`/coupons/${id}`);
    return response.data;
  },

  // ========== CUSTOMER ENDPOINTS ==========

  validateCoupon: async (code, subtotal, email, phone) => {
    const response = await axios.post('/coupons/validate', {
      code,
      subtotal,
      email,
      phone,
    });
    return response.data;
  },
};

export default couponService;
