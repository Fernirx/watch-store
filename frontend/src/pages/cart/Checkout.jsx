import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { addressService } from '../../services';
import guestService from '../../services/guestService';

const Checkout = () => {
  const { cart, subtotal, fetchCart } = useCart();
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
  const [savedAddress, setSavedAddress] = useState(null);
  const [recipientName, setRecipientName] = useState('');

  useEffect(() => {
    fetchCart();

    // Tự động điền thông tin user nếu đã đăng nhập
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.name || '',
        customer_email: user.email || '',
      }));
      fetchSavedAddress();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (cart && cart?.cart?.items?.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const fetchSavedAddress = async () => {
    try {
      const response = await addressService.getDefaultAddress();
      if (response.success && response.data) {
        const addr = response.data;
        setSavedAddress(addr);
        setRecipientName(addr.recipient_name || '');

        // Auto-fill shipping info từ địa chỉ đã lưu
        const fullAddress = `${addr.street}, ${addr.ward}, ${addr.city}${addr.postal_code ? ', ' + addr.postal_code : ''}`;
        setFormData(prev => ({
          ...prev,
          shipping_address: fullAddress,
          shipping_phone: addr.phone || '',
        }));
      } else if (user) {
        // Nếu không có địa chỉ đã lưu, dùng thông tin user
        setFormData(prev => ({
          ...prev,
          shipping_phone: user.phone || '',
        }));
        setRecipientName(user.name || '');
      }
    } catch (error) {
      console.error('Failed to fetch saved address:', error);
      // Fallback to user info
      if (user) {
        setFormData(prev => ({
          ...prev,
          shipping_phone: user.phone || '',
        }));
        setRecipientName(user.name || '');
      }
    }
  };

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
    } else {
      // Remove spaces and dashes
      const phone = formData.shipping_phone.replace(/[\s-]/g, '');

      // Validate Vietnamese phone number (10-11 digits, starts with 0)
      if (!/^0\d{9,10}$/.test(phone)) {
        newErrors.shipping_phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
      }
    }

    // Validate payment method
    if (!formData.payment_method) {
      newErrors.payment_method = 'Vui lòng chọn phương thức thanh toán';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form trước khi submit
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors).join(', '));
      return;
    }

    setLoading(true);

    try {
      // Thêm guest_token nếu chưa đăng nhập
      const orderData = { ...formData };
      const guestToken = guestService.getGuestToken();

      console.log('🔐 Checkout Debug:');
      console.log('  - isAuthenticated:', isAuthenticated);
      console.log('  - user:', user);
      console.log('  - localStorage token:', localStorage.getItem('token'));
      console.log('  - guest_token:', guestToken);

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
      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        const errorList = Object.values(validationErrors).flat().join(', ');
        setError(`${errorMessage}: ${errorList}. Giỏ hàng của bạn vẫn được giữ nguyên, vui lòng thử lại.`);
      } else {
        setError(`${errorMessage}. Giỏ hàng của bạn vẫn được giữ nguyên, vui lòng thử lại.`);
      }
      setLoading(false);
    }
  };

  if (!cart || cart?.cart?.items?.length === 0) {
    return null;
  }

  const cartItems = cart?.cart?.items || [];
  const shippingFee = 30000; // 30,000 VND
  const total = subtotal + shippingFee;

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

            {isAuthenticated && savedAddress && (
              <div className="saved-address-notice">
                <p>✓ Sử dụng địa chỉ đã lưu: <strong>{recipientName}</strong></p>
                <Link to="/profile" className="edit-address-link">
                  Chỉnh sửa địa chỉ
                </Link>
              </div>
            )}

            {isAuthenticated && !savedAddress && (
              <div className="no-address-notice">
                <p>Bạn chưa có địa chỉ đã lưu.</p>
                <Link to="/profile" className="add-address-link">
                  Thêm địa chỉ vào hồ sơ
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
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  required
                  placeholder="Email để nhận xác nhận đơn hàng"
                />
              </div>

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
                  placeholder="Nhập số điện thoại"
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
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
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

              <button type="submit" className="btn-place-order" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đặt Hàng'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>Đơn Hàng Của Bạn</h2>

            <div className="summary-items">
              {cartItems.map((item) => {
                const product = item.product;
                const price = product.sale_price || product.price;

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

            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
              </div>

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
