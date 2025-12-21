import axios from '../api/axiosConfig';

const GUEST_TOKEN_KEY = 'guest_token';

const guestService = {
  // Tạo guest session mới
  createSession: async () => {
    console.log('🔵 guestService.createSession() - Creating new guest session');
    const response = await axios.post('/guest/session');
    const guestToken = response.data.data.guest_token;
    console.log('✅ Guest session created, token:', guestToken.substring(0, 10) + '...');
    localStorage.setItem(GUEST_TOKEN_KEY, guestToken);
    return guestToken;
  },

  // Lấy guest token từ localStorage
  getGuestToken: () => {
    const token = localStorage.getItem(GUEST_TOKEN_KEY);
    console.log('🔍 guestService.getGuestToken():', token ? token.substring(0, 10) + '...' : 'null');
    return token;
  },

  // Xóa guest token
  clearGuestToken: () => {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  },

  // Đảm bảo có guest token (tạo mới nếu chưa có)
  ensureGuestToken: async () => {
    console.log('🔄 guestService.ensureGuestToken() - START');
    let guestToken = guestService.getGuestToken();
    if (!guestToken) {
      console.log('⚠️ No guest token found, creating new session...');
      guestToken = await guestService.createSession();
    } else {
      console.log('✓ Guest token already exists');
    }
    return guestToken;
  },

  // Lấy giỏ hàng guest
  getGuestCart: async () => {
    console.log('🛒 guestService.getGuestCart() - START');

    try {
      const guestToken = await guestService.ensureGuestToken();
      console.log('📡 Fetching guest cart with token:', guestToken.substring(0, 10) + '...');
      const response = await axios.get('/guest/cart', {
        headers: { 'X-Guest-Token': guestToken }
      });
      console.log('✅ Guest cart fetched:', response.data);
      return response.data;
    } catch (error) {
      // If session not found or expired, create new session and retry
      if (error.response?.data?.error?.includes('session') || error.response?.status === 400) {
        console.log('⚠️ Guest session invalid, creating new session...');
        guestService.clearGuestToken();
        const newToken = await guestService.createSession();
        console.log('📡 Fetching cart with new token:', newToken.substring(0, 10) + '...');
        const response = await axios.get('/guest/cart', {
          headers: { 'X-Guest-Token': newToken }
        });
        console.log('✅ Guest cart fetched (new session):', response.data);
        return response.data;
      }
      throw error;
    }
  },

  // Thêm sản phẩm vào giỏ guest
  addToGuestCart: async (product_id, quantity) => {
    console.log('➕ guestService.addToGuestCart() - START', { product_id, quantity });

    try {
      const guestToken = await guestService.ensureGuestToken();
      console.log('📡 Adding to cart with token:', guestToken.substring(0, 10) + '...');
      const response = await axios.post('/guest/cart/items',
        { product_id, quantity },
        { headers: { 'X-Guest-Token': guestToken } }
      );
      console.log('✅ Product added to guest cart:', response.data);
      return response.data;
    } catch (error) {
      // If session not found or expired, create new session and retry
      if (error.response?.data?.error?.includes('session')) {
        console.log('⚠️ Guest session invalid, creating new session and retrying...');
        guestService.clearGuestToken();
        const newToken = await guestService.createSession();
        console.log('📡 Retrying with new token:', newToken.substring(0, 10) + '...');
        const response = await axios.post('/guest/cart/items',
          { product_id, quantity },
          { headers: { 'X-Guest-Token': newToken } }
        );
        console.log('✅ Product added to guest cart (retry):', response.data);
        return response.data;
      }
      throw error;
    }
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
