import axios from '../api/axiosConfig';

const configService = {
  /**
   * Lấy phí ship
   */
  async getShippingFee() {
    try {
      const response = await axios.get('/config/shipping-fee');
      return response.data;
    } catch (error) {
      console.error('Error fetching shipping fee:', error);
      throw error;
    }
  },
};

export default configService;
