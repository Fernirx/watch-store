import axios from '../api/axiosConfig';

const guestOtpService = {
  // Gửi OTP cho guest checkout
  sendCheckoutOtp: async (email, guestToken) => {
    const response = await axios.post('/guest/checkout/send-otp', {
      email,
      guest_token: guestToken,
    });
    return response.data;
  },

  // Xác thực OTP cho guest checkout
  verifyCheckoutOtp: async (email, otp, guestToken) => {
    const response = await axios.post('/guest/checkout/verify-otp', {
      email,
      otp,
      guest_token: guestToken,
    });
    return response.data;
  },

  // Gửi lại OTP cho guest checkout
  resendCheckoutOtp: async (email, guestToken) => {
    const response = await axios.post('/guest/checkout/resend-otp', {
      email,
      guest_token: guestToken,
    });
    return response.data;
  },
};

export default guestOtpService;
