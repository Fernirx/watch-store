import axios from '../api/axiosConfig';

const cartService = {
  // Lấy giỏ hàng
  getCart: async () => {
    const response = await axios.get('/cart');
    return response.data;
  },

  // Thêm sản phẩm vào giỏ
  addToCart: async (product_id, quantity) => {
    const response = await axios.post('/cart/items', { product_id, quantity });
    return response.data;
  },

  // Cập nhật số lượng
  updateCartItem: async (id, quantity) => {
    const response = await axios.put(`/cart/items/${id}`, { quantity });
    return response.data;
  },

  // Xóa sản phẩm khỏi giỏ
  removeCartItem: async (id) => {
    const response = await axios.delete(`/cart/items/${id}`);
    return response.data;
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async () => {
    const response = await axios.delete('/cart/clear');
    return response.data;
  },
};

export default cartService;
