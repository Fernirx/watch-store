import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Chỉ redirect nếu không phải đang ở trang login/register
      const isAuthPage = window.location.pathname.startsWith('/login') ||
                         window.location.pathname.startsWith('/register') ||
                         window.location.pathname.startsWith('/verify-otp') ||
                         window.location.pathname.startsWith('/forgot-password');

      if (!isAuthPage) {
        // Token hết hạn hoặc không hợp lệ - xóa và redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_BASE_URL };