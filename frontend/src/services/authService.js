import axios from '../api/axiosConfig';

const authService = {
  // Đăng nhập
  login: async (email, password) => {
    const response = await axios.post('/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
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
    const response = await axios.post('/register/verify', { email, otp });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
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
    window.location.href = `${axios.defaults.baseURL}/auth/google`;
  },

  // Đăng xuất
  logout: async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
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
    const response = await axios.post('/refresh');
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.access_token);
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
    return user?.role === 'admin';
  },
};

export default authService;
