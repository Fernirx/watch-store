import axios from '../api/axiosConfig';

const addressService = {
    // Lấy danh sách địa chỉ
    getAddresses: async () => {
        const response = await axios.get('/addresses');
        return response.data;
    },

    // Lấy địa chỉ mặc định
    getDefaultAddress: async () => {
        const response = await axios.get('/addresses/default');
        return response.data;
    },

    // Tạo địa chỉ mới
    createAddress: async (addressData) => {
        const response = await axios.post('/addresses', addressData);
        return response.data;
    },

    // Cập nhật địa chỉ
    updateAddress: async (id, addressData) => {
        const response = await axios.put(`/addresses/${id}`, addressData);
        return response.data;
    },

    // Set địa chỉ mặc định
    setDefaultAddress: async (id) => {
        const response = await axios.put(`/addresses/${id}/set-default`);
        return response.data;
    },

    // Xóa địa chỉ
    deleteAddress: async (id) => {
        const response = await axios.delete(`/addresses/${id}`);
        return response.data;
    },
};

export default addressService;