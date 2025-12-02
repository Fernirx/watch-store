import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';

const Checkout = () => {
  const { cart, subtotal, fetchCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_phone: '',
    payment_method: 'cod',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (cart && cart?.cart?.items?.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  useEffect(() => {
    // Pre-fill với thông tin user
    if (user) {
      setFormData(prev => ({
        ...prev,
        shipping_phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await orderService.createOrder(formData);
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
        // Với các phương thức khác, chuyển đến trang chi tiết đơn hàng
        navigate(`/orders/${orderId}`, {
          state: { message: 'Đặt hàng thành công!' },
        });
      }
    } catch (err) {
      console.error('Order creation error:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Đặt hàng thất bại';
      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        const errorList = Object.values(validationErrors).flat().join(', ');
        setError(`${errorMessage}: ${errorList}`);
      } else {
        setError(errorMessage);
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

            <form onSubmit={handleSubmit}>
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
