import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './Payment.css';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchCart } = useCart();
  const orderId = searchParams.get('order_id');
  const errorCode = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    // Làm mới giỏ hàng khi vào trang này (cart đã được restore từ backend)
    fetchCart();
  }, []);

  const getErrorMessage = () => {
    if (error === 'invalid_signature') {
      return 'Chữ ký thanh toán không hợp lệ. Vui lòng thử lại.';
    }
    if (error === 'order_not_found') {
      return 'Không tìm thấy đơn hàng. Vui lòng liên hệ hỗ trợ.';
    }
    if (error === 'processing_error') {
      return 'Lỗi xử lý thanh toán. Vui lòng thử lại sau.';
    }
    if (error === 'system_error') {
      return 'Lỗi hệ thống. Vui lòng thử lại sau.';
    }
    if (errorCode) {
      return `Giao dịch thất bại với mã lỗi: ${errorCode}`;
    }
    return 'Thanh toán không thành công. Vui lòng thử lại.';
  };

  const handleTryAgain = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="payment-result-page">
      <div className="container">
        <div className="payment-result-card failed">
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>

          <h1>Thanh Toán Thất Bại</h1>
          <p className="result-message">{getErrorMessage()}</p>

          {orderId && (
            <div className="order-info">
              <p>Mã đơn hàng: <strong>#{orderId}</strong></p>
            </div>
          )}

          <div className="order-info">
            <p className="note">✅ Giỏ hàng của bạn vẫn còn nguyên.</p>
            <p className="note">Bạn có thể quay lại giỏ hàng để đặt hàng lại.</p>
          </div>

          <div className="result-actions">
            <button className="btn btn-primary" onClick={() => navigate('/cart')}>
              Quay Lại Giỏ Hàng
            </button>
            <button className="btn btn-secondary" onClick={handleBackToHome}>
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
