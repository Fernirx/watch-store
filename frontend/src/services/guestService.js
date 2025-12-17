import axios from '../api/axiosConfig';

const GUEST_TOKEN_KEY = 'guest_token';

const guestService = {
  // Tạo guest session mới
  createSession: async () => {
    const response = await axios.post('/guest/session');
    const guestToken = response.data.data.guest_token;
    localStorage.setItem(GUEST_TOKEN_KEY, guestToken);
    return guestToken;
  },

  // Lấy guest token từ localStorage
  getGuestToken: () => {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  },

  // Xóa guest token
  clearGuestToken: () => {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  },

  // Đảm bảo có guest token (tạo mới nếu chưa có)
  ensureGuestToken: async () => {
    let guestToken = guestService.getGuestToken();
    if (!guestToken) {
      guestToken = await guestService.createSession();
    }
    return guestToken;
  },

  // Lấy giỏ hàng guest
  getGuestCart: async () => {
    const guestToken = await guestService.ensureGuestToken();
    const response = await axios.get('/guest/cart', {
      headers: { 'X-Guest-Token': guestToken }
    });
    return response.data;
  },

  // Thêm sản phẩm vào giỏ guest
  addToGuestCart: async (product_id, quantity) => {
    const guestToken = await guestService.ensureGuestToken();
    const response = await axios.post('/guest/cart/items',
      { product_id, quantity },
      { headers: { 'X-Guest-Token': guestToken } }
    );
    return response.data;
  },

  // Cập nhật số lượng trong giỏ guest
  updateGuestCartItem: async (id, quantity) => {
    const guestToken = await guestService.ensureGuestToken();
    const response = await axios.put(`/guest/cart/items/${id}`,
      { quantity },
      { headers: { 'X-Guest-Token': guestToken } }
    );
    return response.data;
  },

  // Xóa sản phẩm khỏi giỏ guest
  removeGuestCartItem: async (id) => {
    const guestToken = await guestService.ensureGuestToken();
    const response = await axios.delete(`/guest/cart/items/${id}`, {
      headers: { 'X-Guest-Token': guestToken }
    });
    return response.data;
  },

  // Xóa toàn bộ giỏ hàng guest
  clearGuestCart: async () => {
    const guestToken = await guestService.ensureGuestToken();
    const response = await axios.delete('/guest/cart/clear', {
      headers: { 'X-Guest-Token': guestToken }
    });
    return response.data;
  },
};

export default guestService;
