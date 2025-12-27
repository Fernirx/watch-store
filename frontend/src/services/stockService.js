import axios from '../api/axiosConfig';

const stockService = {
  importStock: async (importData) => {
    const response = await axios.post('/stock/import', importData);
    return response.data;
  },

  exportStock: async (exportData) => {
    const response = await axios.post('/stock/export', exportData);
    return response.data;
  },

  getLowStock: async () => {
    const response = await axios.get('/stock/low-stock');
    return response.data;
  },

  getStockReport: async (filters = {}) => {
    const response = await axios.get('/stock/report', { params: filters });
    return response.data;
  },

  getTransactions: async (filters = {}) => {
    const response = await axios.get('/stock/transactions', { params: filters });
    return response.data;
  },
};

export default stockService;
