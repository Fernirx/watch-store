import axios from '../api/axiosConfig';

const paymentService = {
  // Tạo payment URL VNPay
  createVNPayPayment: async (orderId) => {
    const response = await axios.post('/vnpay/create-payment', {
      order_id: orderId,
    });
    return response.data;
  },
};

export default paymentService;
