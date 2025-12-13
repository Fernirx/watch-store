import axios from '../api/axiosConfig';

const profileService = {
  // Lấy thông tin profile
  getProfile: async () => {
    const response = await axios.get('/profile');
    return response.data;
  },

  // Cập nhật thông tin profile
  updateProfile: async (profileData) => {
    const response = await axios.put('/profile', profileData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axios.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa avatar
  deleteAvatar: async () => {
    const response = await axios.delete('/profile/avatar');
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    const response = await axios.put('/profile/change-password', passwordData);
    return response.data;
  },
};

export default profileService;