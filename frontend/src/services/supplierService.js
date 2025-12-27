import axios from '../api/axiosConfig';

const supplierService = {
  getSuppliers: async () => {
    const response = await axios.get('/suppliers');
    return response.data;
  },

  getSupplier: async (id) => {
    const response = await axios.get(`/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (supplierData) => {
    const response = await axios.post('/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (id, supplierData) => {
    const response = await axios.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  deleteSupplier: async (id) => {
    const response = await axios.delete(`/suppliers/${id}`);
    return response.data;
  },
};

export default supplierService;
