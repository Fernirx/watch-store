import { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import './Payment.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Get order info from URL params (VNPay callback) or location state (guest checkout)
  const orderId = searchParams.get('order_id');
  const orderNumber = location.state?.orderNumber;
  const isGuest = location.state?.isGuest || false;
  const message = location.state?.message;

  useEffect(() => {
    // Xóa pending order flag vì đã thanh toán thành công
    sessionStorage.removeItem('vnpay_pending_order');

    // Làm mới giỏ hàng sau khi thanh toán thành công
    fetchCart();
  }, []);

  const handleViewOrder = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="payment-result-page">
      <div className="container">
        <div className="payment-result-card success">
          <div className="result-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h1>{message || 'Thanh Toán Thành Công!'}</h1>
          <p className="result-message">
            {isGuest
              ? 'Đơn hàng của bạn đã được đặt thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất.'
              : 'Đơn hàng của bạn đã được thanh toán thành công qua VNPay.'}
          </p>

          {(orderId || orderNumber) && (
            <div className="order-info">
              <p>Mã đơn hàng: <strong>{orderNumber || `#${orderId}`}</strong></p>
              {isGuest && (
                <p className="guest-notice">
                  Vui lòng lưu lại mã đơn hàng này để theo dõi đơn hàng của bạn.
                </p>
              )}
            </div>
          )}

          <div className="result-actions">
            {isAuthenticated && !isGuest && (
              <button className="btn btn-primary" onClick={handleViewOrder}>
                Xem Chi Tiết Đơn Hàng
              </button>
            )}
            {isGuest && (
              <button className="btn btn-primary" onClick={handleLogin}>
                Đăng Nhập để Theo Dõi Đơn Hàng
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleContinueShopping}>
              Tiếp Tục Mua Sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
