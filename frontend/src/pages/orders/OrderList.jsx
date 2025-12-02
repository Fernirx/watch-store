import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import orderService from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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
    return <div className="loading">Đang tải đơn hàng...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-orders">
        <div className="container">
          <h2>Chưa có đơn hàng nào</h2>
          <p>Bạn chưa đặt đơn hàng nào</p>
          <Link to="/products" className="btn-primary">
            Mua Sắm Ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1>Đơn Hàng Của Tôi</h1>

        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Đơn hàng #{order.order_number}</h3>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className={`order-status ${getStatusClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div className="order-body">
                <div className="order-items">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="order-item">
                      <img
                        src={item.product?.images?.[0]?.image_url || '/placeholder.jpg'}
                        alt={item.product?.name}
                      />
                      <div className="item-details">
                        <p>{item.product?.name}</p>
                        <span>x{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="more-items">+{order.items.length - 3} sản phẩm khác</p>
                  )}
                </div>

                <div className="order-total">
                  <span>Tổng cộng:</span>
                  <strong>{parseFloat(order.total).toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>

              <div className="order-actions">
                <Link to={`/orders/${order.id}`} className="btn-view-detail">
                  Xem Chi Tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
