import axios from '../api/axiosConfig';
import guestService from './guestService';

const authService = {
  // Đăng nhập
  login: async (email, password) => {
    const guestToken = guestService.getGuestToken();
    console.log('🔑 Login - Guest token:', guestToken);
    const response = await axios.post('/login', {
      email,
      password,
      guest_token: guestToken // Gửi guest_token để merge cart
    });
    console.log('✅ Login response:', response.data);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('refresh_token', response.data.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      // Xóa guest token sau khi đăng nhập thành công
      console.log('🗑️ Clearing guest token');
      guestService.clearGuestToken();
    }
    return response.data;
  },

  // Đăng ký - Bước 1: Gửi thông tin và nhận OTP
  sendRegisterOtp: async (name, email, password, password_confirmation) => {
    const response = await axios.post('/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    return response.data;
  },

  // Đăng ký - Bước 2: Xác thực OTP
  verifyRegisterOtp: async (email, otp) => {
    const guestToken = guestService.getGuestToken();
    const response = await axios.post('/register/verify', {
      email,
      otp,
      guest_token: guestToken // Gửi guest_token để merge cart
    });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('refresh_token', response.data.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      // Xóa guest token sau khi đăng ký thành công
      guestService.clearGuestToken();
    }
    return response.data;
  },

  // Quên mật khẩu - Bước 1: Gửi OTP
  sendForgotPasswordOtp: async (email) => {
    const response = await axios.post('/forgot-password/send-otp', { email });
    return response.data;
  },

  // Quên mật khẩu - Bước 2: Đặt lại mật khẩu
  resetPassword: async (email, otp, password, password_confirmation) => {
    const response = await axios.post('/forgot-password/reset', {
      email,
      otp,
      password,
      password_confirmation,
    });
    return response.data;
  },

  // Google OAuth - Redirect
  googleLogin: () => {
    const guestToken = guestService.getGuestToken();
    const url = new URL(`${axios.defaults.baseURL}/auth/google`);
    if (guestToken) {
      url.searchParams.append('guest_token', guestToken);
    }
    window.location.href = url.toString();
  },

  // Đăng xuất
  logout: async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await axios.get('/me');
    return response.data.data.user;
  },

  // Refresh token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post('/refresh', {
      refresh_token: refreshToken,
    });

    if (response.data.success) {
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('refresh_token', response.data.data.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Lấy user từ localStorage
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Kiểm tra có phải admin không
  isAdmin: () => {
    const user = authService.getUser();
    return user?.role === 'ADMIN';
  },
};

export default authService;
