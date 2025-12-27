import axios from '../api/axiosConfig';

const notificationService = {
  // ========== CUSTOMER ENDPOINTS ==========

  getNotifications: async () => {
    const response = await axios.get('/notifications');
    return response.data;
  },

  getNotification: async (id) => {
    const response = await axios.get(`/notifications/${id}`);
    return response.data;
  },

  // ========== ADMIN ENDPOINTS ==========

  getAllNotifications: async () => {
    const response = await axios.get('/notifications');
    return response.data;
  },

  createNotification: async (notificationData) => {
    const response = await axios.post('/notifications', notificationData);
    return response.data;
  },

  updateNotification: async (id, notificationData) => {
    const response = await axios.put(`/notifications/${id}`, notificationData);
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await axios.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default notificationService;
