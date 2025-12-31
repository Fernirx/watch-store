import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import guestService from '../../services/guestService';
import couponService from '../../services/couponService';
import guestOtpService from '../../services/guestOtpService';

const Checkout = () => {
  const { cart, subtotal, fetchCart, loading: cartLoading } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    shipping_address: '',
    shipping_phone: '',
    payment_method: 'cod',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Guest OTP states (chỉ cho guest checkout)
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    fetchCart();

    // Tự động điền thông tin user nếu đã đăng nhập
    if (isAuthenticated && user) {
      const customer = user.customer || {};
      setFormData(prev => ({
        ...prev,
        customer_name: customer.shipping_name || customer.name || user.name || '',
        customer_email: user.email || '',
        shipping_phone: customer.shipping_phone || '',
        shipping_address: customer.shipping_address || '',
      }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Chỉ redirect khi đã load xong VÀ giỏ hàng thật sự rỗng
    // Tránh redirect trong lúc đang load (khi refresh trang)
    if (!cartLoading && cart && cart?.cart?.items?.length === 0) {
      navigate('/cart');
    }
  }, [cart, cartLoading, navigate]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpCountdown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate tên khách hàng
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Tên khách hàng là bắt buộc';
    } else if (formData.customer_name.trim().length < 2) {
      newErrors.customer_name = 'Tên phải có ít nhất 2 ký tự';
    }

    // Validate email
    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Email không hợp lệ';
    }

    // Validate địa chỉ
    if (!formData.shipping_address.trim()) {
      newErrors.shipping_address = 'Địa chỉ giao hàng là bắt buộc';
    } else if (formData.shipping_address.trim().length < 10) {
      newErrors.shipping_address = 'Địa chỉ phải có ít nhất 10 ký tự';
    }

    // Validate số điện thoại (format Việt Nam)
    if (!formData.shipping_phone.trim()) {
      newErrors.shipping_phone = 'Số điện thoại là bắt buộc';
    } else if (formData.shipping_phone.length > 15) {
      newErrors.shipping_phone = 'Số điện thoại không được vượt quá 15 ký tự';
    } else {
      // Remove spaces and dashes
      const phone = formData.shipping_phone.replace(/[\s-]/g, '');

      // Validate Vietnamese phone number (10 digits: 03x, 05x, 07x, 08x, 09x)
      if (!/^(0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(phone)) {
        newErrors.shipping_phone = 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0912345678)';
      }
    }

    // Validate payment method
    if (!formData.payment_method) {
      newErrors.payment_method = 'Vui lòng chọn phương thức thanh toán';
    }

    return newErrors;
  };

  // Handle apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    // Need email and phone to validate
    if (!formData.customer_email || !formData.shipping_phone) {
      setCouponError('Vui lòng nhập email và số điện thoại trước');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await couponService.validateCoupon(
        couponCode,
        subtotal,
        formData.customer_email,
        formData.shipping_phone
      );

      setAppliedCoupon({
        code: couponCode,
        discount_amount: response.data.discount_amount,
        discount_type: response.data.discount_type,
        discount_value: response.data.discount_value,
      });

      setCouponError('');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Guest OTP handlers
  const handleSendOtp = async () => {
    if (!formData.customer_email.trim()) {
      setOtpError('Vui lòng nhập email trước');
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      setOtpError('Email không hợp lệ');
      return;
    }

    setSendingOtp(true);
    setOtpError('');

    try {
      const guestToken = guestService.getGuestToken();
      await guestOtpService.sendCheckoutOtp(formData.customer_email, guestToken);

      setOtpSent(true);
      setOtpCountdown(600); // 10 phút countdown
      setOtpError('');
    } catch (err) {
      console.error('Send OTP error:', err);
      setOtpError(err.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    try {
      const guestToken = guestService.getGuestToken();
      const response = await guestOtpService.verifyCheckoutOtp(
        formData.customer_email,
        otp,
        guestToken
      );

      if (response.success) {
        setOtpVerified(true);
        setOtpError('');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpError(err.response?.data?.message || 'Mã OTP không đúng. Vui lòng thử lại.');
      setOtpVerified(false);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setSendingOtp(true);
    setOtpError('');
    setOtp('');

    try {
      const guestToken = guestService.getGuestToken();
      await guestOtpService.resendCheckoutOtp(formData.customer_email, guestToken);

      setOtpCountdown(600); // Reset countdown
      setOtpError('');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpError(err.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra OTP verification cho GUEST users
    if (!isAuthenticated && !otpVerified) {
      setError('Vui lòng xác thực email trước khi đặt hàng');
      setOtpError('Email chưa được xác thực');
      return;
    }

    // Validate form trước khi submit
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors).join(', '));
      return;
    }

    setLoading(true);

    try {
      // Thêm guest_token và coupon nếu có
      const orderData = {
        ...formData,
        coupon_code: appliedCoupon?.code || null,
      };
      const guestToken = guestService.getGuestToken();

      console.log('🔐 Checkout Debug:');
      console.log('  - isAuthenticated:', isAuthenticated);
      console.log('  - user:', user);
      console.log('  - localStorage token:', localStorage.getItem('token'));
      console.log('  - guest_token:', guestToken);
      console.log('  - coupon_code:', orderData.coupon_code);

      // Luôn gửi guest_token nếu có (cho cả user và guest)
      if (guestToken) {
        orderData.guest_token = guestToken;
        console.log('  ✅ Added guest_token to orderData');
      } else {
        console.log('  ⚠️ No guest_token found');
      }

      console.log('  - orderData:', orderData);

      const response = await orderService.createOrder(orderData);
      const orderId = response.data.id;

      // Nếu chọn VNPay, tạo payment URL và redirect
      if (formData.payment_method === 'vnpay') {
        try {
          const paymentResponse = await paymentService.createVNPayPayment(orderId);

          if (paymentResponse.success && paymentResponse.payment_url) {
            // Redirect đến VNPay payment gateway
            window.location.href = paymentResponse.payment_url;
          } else {
            throw new Error('Không thể tạo URL thanh toán');
          }
        } catch (paymentErr) {
          setError('Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại.');
          setLoading(false);
          return;
        }
      } else {
        // Với các phương thức khác
        if (isAuthenticated) {
          // User đã đăng nhập: chuyển đến trang chi tiết đơn hàng
          navigate(`/orders/${orderId}`, {
            state: { message: 'Đặt hàng thành công!' },
          });
        } else {
          // Guest user: chuyển đến trang payment success với order info
          navigate('/payment/success', {
            state: {
              message: 'Đặt hàng thành công!',
              orderNumber: response.data.order_number,
              isGuest: true
            },
          });
        }
      }
    } catch (err) {
      console.error('Order creation error:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Đặt hàng thất bại';
      const errorCode = err.response?.data?.error_code;
      const validationErrors = err.response?.data?.errors;

      // Xử lý lỗi EMAIL_NOT_VERIFIED - giữ user ở trang checkout
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        setError('Email chưa được xác thực. Vui lòng xác thực email trước khi đặt hàng.');
        setOtpError('Email chưa được xác thực');
        setOtpVerified(false);
        setLoading(false);
      } else {
        // Các lỗi khác (stock, validation, v.v.) - chuyển về trang giỏ hàng
        let finalErrorMessage = errorMessage;

        if (validationErrors) {
          const errorList = Object.values(validationErrors).flat().join(', ');
          finalErrorMessage = `${errorMessage}: ${errorList}`;
        }

        // Làm mới giỏ hàng
        await fetchCart();

        // Chuyển về trang giỏ hàng với thông báo lỗi
        navigate('/cart', {
          state: {
            error: finalErrorMessage,
            message: 'Đã có lỗi xảy ra khi đặt hàng. Giỏ hàng của bạn vẫn được giữ nguyên, vui lòng kiểm tra và thử lại.'
          }
        });
      }
    }
  };

  // Hiển thị loading trong khi đang tải giỏ hàng
  if (cartLoading && (!cart || !cart?.cart)) {
    return (
      <div className="loading">
        <div className="spinner-large"></div>
        <p>Đang tải thông tin giỏ hàng...</p>
      </div>
    );
  }

  // Chỉ return null sau khi đã load xong và giỏ hàng rỗng
  // (useEffect sẽ redirect về /cart)
  if (!cartLoading && (!cart || cart?.cart?.items?.length === 0)) {
    return null;
  }

  const cartItems = cart?.cart?.items || [];
  const shippingFee = 30000; // 30,000 VND
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const total = subtotal + shippingFee - discountAmount;

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Thanh Toán</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="checkout-layout">
          {/* Checkout Form */}
          <div className="checkout-form">
            <h2>Thông Tin Giao Hàng</h2>

            {!isAuthenticated && (
              <div className="guest-checkout-notice">
                <p>Bạn đang thanh toán với tư cách khách. <Link to="/login">Đăng nhập</Link> để sử dụng địa chỉ đã lưu.</p>
              </div>
            )}

            {isAuthenticated && (
              <div className="saved-address-notice">
                <p>✓ Thông tin đã được tự động điền từ hồ sơ của bạn</p>
                <Link to="/profile" className="edit-address-link">
                  Chỉnh sửa thông tin trong hồ sơ
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên khách hàng *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  placeholder="Nhập tên của bạn"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleChange}
                    required
                    placeholder="Email để nhận xác nhận đơn hàng"
                    style={{ flex: 1 }}
                    disabled={isAuthenticated || otpVerified}
                  />
                  {!isAuthenticated && !otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpSent}
                      style={{
                        padding: '0.625rem 1rem',
                        background: otpSent ? '#9ca3af' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: otpSent ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sendingOtp ? 'Đang gửi...' : otpSent ? 'Đã gửi OTP' : 'Gửi OTP'}
                    </button>
                  )}
                  {!isAuthenticated && otpVerified && (
                    <span style={{
                      padding: '0.625rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                    }}>
                      ✓ Đã xác thực
                    </span>
                  )}
                </div>
              </div>

              {/* Guest OTP Section */}
              {!isAuthenticated && otpSent && !otpVerified && (
                <div className="form-group" style={{
                  background: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <label>Mã OTP (6 chữ số) *</label>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Mã OTP đã được gửi đến email: <strong>{formData.customer_email}</strong>
                  </p>

                  {otpCountdown > 0 && (
                    <p style={{ fontSize: '0.875rem', color: '#667eea', marginBottom: '0.5rem' }}>
                      Mã có hiệu lực trong: <strong>{Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</strong>
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="Nhập mã OTP"
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        textAlign: 'center',
                        letterSpacing: '0.5rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                      style={{
                        padding: '0.625rem 1rem',
                        background: otp.length === 6 ? '#10b981' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {verifyingOtp ? 'Đang xác thực...' : 'Xác thực'}
                    </button>
                  </div>

                  {otpError && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {otpError}
                    </p>
                  )}

                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    Không nhận được mã?{' '}
                    {otpCountdown > 540 ? (
                      <span>Bạn có thể gửi lại sau {otpCountdown - 540}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={sendingOtp}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#667eea',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        {sendingOtp ? 'Đang gửi...' : 'Gửi lại OTP'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Địa chỉ giao hàng *</label>
                <textarea
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Nhập địa chỉ đầy đủ để giao hàng"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  name="shipping_phone"
                  value={formData.shipping_phone}
                  onChange={handleChange}
                  required
                  placeholder="Số điện thoại để shipper liên lạc giao hàng"
                />
              </div>

              <div className="form-group">
                <label>Phương thức thanh toán *</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  required
                >
                  <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                  <option value="vnpay">Thanh toán qua VNPay</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                />
              </div>

              <button
                type="submit"
                className="btn-place-order"
                disabled={loading || (!isAuthenticated && !otpVerified)}
              >
                {loading
                  ? 'Đang xử lý...'
                  : (!isAuthenticated && !otpVerified)
                    ? 'Xác thực email để đặt hàng'
                    : 'Đặt Hàng'
                }
              </button>

              {!isAuthenticated && !otpVerified && (
                <p style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem'
                }}>
                  Vui lòng xác thực email trước khi đặt hàng
                </p>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>Đơn Hàng Của Bạn</h2>

            <div className="summary-items">
              {cartItems.map((item) => {
                const product = item.product;
                const price = product.price;

                return (
                  <div key={item.id} className="summary-item">
                    <div className="item-info">
                      <span className="item-name">{product.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                    <div className="item-price">
                      {(parseFloat(price) * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Section */}
            <div className="coupon-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Mã Giảm Giá</h3>

              {!appliedCoupon ? (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá"
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon}
                      style={{
                        padding: '0.625rem 1rem',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {validatingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                  {couponError && (
                    <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {couponError}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '0.375rem',
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#166534' }}>{appliedCoupon.code}</div>
                    <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                      Giảm {discountAmount.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      padding: '0.25rem',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
              </div>

              {appliedCoupon && (
                <div className="summary-row" style={{ color: '#dc2626' }}>
                  <span>Giảm giá ({appliedCoupon.code}):</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Tổng cộng:</span>
                <span>{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
