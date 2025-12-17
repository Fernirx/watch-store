import axios from '../api/axiosConfig';
import guestService from './guestService';

const cartService = {
  // Lấy giỏ hàng (tự động chọn user hoặc guest)
  getCart: async (isAuthenticated) => {
    if (isAuthenticated) {
      const response = await axios.get('/cart');
      return response.data;
    } else {
      return await guestService.getGuestCart();
    }
  },

  // Thêm sản phẩm vào giỏ
  addToCart: async (product_id, quantity, isAuthenticated) => {
    if (isAuthenticated) {
      const response = await axios.post('/cart/items', { product_id, quantity });
      return response.data;
    } else {
      return await guestService.addToGuestCart(product_id, quantity);
    }
  },

  // Cập nhật số lượng
  updateCartItem: async (id, quantity, isAuthenticated) => {
    if (isAuthenticated) {
      const response = await axios.put(`/cart/items/${id}`, { quantity });
      return response.data;
    } else {
      return await guestService.updateGuestCartItem(id, quantity);
    }
  },

  // Xóa sản phẩm khỏi giỏ
  removeCartItem: async (id, isAuthenticated) => {
    if (isAuthenticated) {
      const response = await axios.delete(`/cart/items/${id}`);
      return response.data;
    } else {
      return await guestService.removeGuestCartItem(id);
    }
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async (isAuthenticated) => {
    if (isAuthenticated) {
      const response = await axios.delete('/cart/clear');
      return response.data;
    } else {
      return await guestService.clearGuestCart();
    }
  },
};

export default cartService;
