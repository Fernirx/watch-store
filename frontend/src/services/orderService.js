import axios from '../api/axiosConfig';

const orderService = {
  // Lấy danh sách đơn hàng
  getOrders: async () => {
    const response = await axios.get('/orders');
    return response.data;
  },

  // Lấy chi tiết đơn hàng
  getOrder: async (id) => {
    const response = await axios.get(`/orders/${id}`);
    return response.data;
  },

  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    const response = await axios.post('/orders', orderData);
    return response.data;
  },

  // Hủy đơn hàng
  cancelOrder: async (id) => {
    const response = await axios.put(`/orders/${id}/cancel`);
    return response.data;
  },
};

export default orderService;
