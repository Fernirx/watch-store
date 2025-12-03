import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './Payment.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchCart } = useCart();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
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

          <h1>Thanh Toán Thành Công!</h1>
          <p className="result-message">
            Đơn hàng của bạn đã được thanh toán thành công qua VNPay.
          </p>

          {orderId && (
            <div className="order-info">
              <p>Mã đơn hàng: <strong>#{orderId}</strong></p>
            </div>
          )}

          <div className="result-actions">
            <button className="btn btn-primary" onClick={handleViewOrder}>
              Xem Chi Tiết Đơn Hàng
            </button>
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
