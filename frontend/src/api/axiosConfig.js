import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Flag để tránh multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

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
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi không phải 401, hoặc đã retry rồi, reject luôn
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu request là refresh token API và bị 401, logout
    if (originalRequest.url === '/refresh') {
      isRefreshing = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Kiểm tra xem có phải trang auth không
    const isAuthPage = window.location.pathname.startsWith('/login') ||
                       window.location.pathname.startsWith('/register') ||
                       window.location.pathname.startsWith('/verify-otp') ||
                       window.location.pathname.startsWith('/forgot-password');

    if (isAuthPage) {
      return Promise.reject(error);
    }

    // Nếu đang refresh, đưa request vào queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      isRefreshing = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Gọi API refresh token
      const response = await axios.post(
        `${API_BASE_URL}/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      if (response.data.success) {
        const { access_token, refresh_token: newRefreshToken } = response.data.data;

        // Lưu token mới
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        // Update header của request ban đầu
        originalRequest.headers.Authorization = 'Bearer ' + access_token;

        // Process queue
        processQueue(null, access_token);

        isRefreshing = false;

        // Retry request ban đầu với token mới
        return axiosInstance(originalRequest);
      } else {
        throw new Error('Refresh token failed');
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;

      // Refresh failed, logout
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';

      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
export { API_BASE_URL };
