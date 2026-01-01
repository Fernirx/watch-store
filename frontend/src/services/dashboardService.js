import axios from '../api/axiosConfig';

const dashboardService = {
  // Lấy tổng quan thống kê dashboard
  getStats: async () => {
    const response = await axios.get('/dashboard/stats');
    return response.data;
  },

  // Lấy revenue trend cho line chart
  getRevenueTrend: async (days = 7) => {
    const response = await axios.get(`/charts/revenue-trend?days=${days}`);
    return response.data;
  },

  // Lấy phân bổ đơn hàng theo trạng thái cho pie chart
  getOrderStatusDistribution: async () => {
    const response = await axios.get('/charts/order-status');
    return response.data;
  },
};

export default dashboardService;
