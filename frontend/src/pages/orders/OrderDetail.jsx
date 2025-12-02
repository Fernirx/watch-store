import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import orderService from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const successMessage = location.state?.message;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrder(id);
      setOrder(data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await orderService.cancelOrder(id);
      fetchOrder(); // Reload order
      alert('Đơn hàng đã được hủy');
    } catch (error) {
      alert('Không thể hủy đơn hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: 'Chờ xử lý',
      PAID: 'Đã thanh toán',
      PROCESSING: 'Đang xử lý',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      PENDING: 'status-pending',
      PAID: 'status-paid',
      PROCESSING: 'status-processing',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
    };
    return classMap[status] || '';
  };

  if (loading) {
    return <div className="loading">Đang tải chi tiết đơn hàng...</div>;
  }

  if (!order) {
    return <div className="error-page">Không tìm thấy đơn hàng</div>;
  }

  const canCancel = ['PENDING', 'PAID'].includes(order.status);

  return (
    <div className="order-detail-page">
      <div className="container">
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <div className="order-header">
          <div>
            <h1>Đơn Hàng #{order.order_number}</h1>
            <p className="order-date">
              Đặt ngày: {new Date(order.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
          <div className={`order-status ${getStatusClass(order.status)}`}>
            {getStatusLabel(order.status)}
          </div>
        </div>

        <div className="order-content">
          {/* Customer Info */}
          <div className="info-section">
            <h2>Thông Tin Khách Hàng</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Họ tên:</label>
                <span>{order.customer_name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{order.customer_email}</span>
              </div>
              {order.customer_phone && (
                <div className="info-item">
                  <label>Số điện thoại:</label>
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="items-section">
            <h2>Sản Phẩm</h2>
            <div className="order-items">
              {order.items?.map((item) => (
                <div key={item.id} className="order-item-detail">
                  <img
                    src={item.product?.images?.[0]?.image_url || '/placeholder.jpg'}
                    alt={item.product?.name}
                  />
                  <div className="item-info">
                    <h3>{item.product?.name}</h3>
                    <p className="brand">{item.product?.brand?.name}</p>
                    <p className="quantity">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    {parseFloat(item.price).toLocaleString('vi-VN')}đ
                  </div>
                  <div className="item-total">
                    {(parseFloat(item.price) * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="summary-section">
            <h2>Tổng Kết</h2>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{parseFloat(order.subtotal).toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="summary-row total">
                <span>Tổng cộng:</span>
                <strong>{parseFloat(order.total).toLocaleString('vi-VN')}đ</strong>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canCancel && (
            <div className="order-actions">
              <button onClick={handleCancelOrder} className="btn-cancel-order">
                Hủy Đơn Hàng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
