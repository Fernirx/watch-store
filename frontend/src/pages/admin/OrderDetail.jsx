import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axiosConfig';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      setMessage({ type: 'error', text: 'Không thể tải thông tin đơn hàng' });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    if (updating) return; // Prevent multiple clicks

    try {
      setUpdating(true);
      await axios.put(`/orders/${id}/status`, { status: newStatus });
      setMessage({ type: 'success', text: 'Cập nhật trạng thái đơn hàng thành công!' });
      await fetchOrder();
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage({ type: 'error', text: 'Không thể cập nhật trạng thái đơn hàng' });
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (newPaymentStatus) => {
    if (updating) return; // Prevent multiple clicks

    try {
      setUpdating(true);
      await axios.put(`/orders/${id}/payment-status`, { payment_status: newPaymentStatus });
      setMessage({ type: 'success', text: 'Cập nhật trạng thái thanh toán thành công!' });
      await fetchOrder();
    } catch (error) {
      console.error('Error updating payment status:', error);
      setMessage({ type: 'error', text: 'Không thể cập nhật trạng thái thanh toán' });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: 'Chờ xử lý', class: 'badge-warning' },
      PROCESSING: { label: 'Đang xử lý', class: 'badge-info' },
      COMPLETED: { label: 'Hoàn thành', class: 'badge-success' },
      CANCELLED: { label: 'Đã hủy', class: 'badge-danger' },
    };

    const statusInfo = statusMap[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Chưa thanh toán', class: 'badge-warning' },
      paid: { label: '✓ Đã thanh toán', class: 'badge-success' },
      failed: { label: '✗ Thất bại', class: 'badge-danger' },
    };

    const statusInfo = statusMap[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!order) {
    return <div>Không tìm thấy đơn hàng</div>;
  }

  return (
    <div className="admin-order-detail">
      <div className="admin-header">
        <h1>Chi Tiết Đơn Hàng #{order.id}</h1>
        <button onClick={() => navigate('/admin/orders')} className="btn-back">
          Quay lại
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`alert alert-${message.type}`} style={{
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          fontWeight: '500',
        }}>
          {message.type === 'success' ? '✓ ' : '✗ '}
          {message.text}
        </div>
      )}

      <div className="order-info-grid">
        <div className="info-card">
          <h3>Thông Tin Đơn Hàng</h3>
          <div className="info-row">
            <span className="label">Mã đơn hàng:</span>
            <span className="value">#{order.id}</span>
          </div>
          <div className="info-row">
            <span className="label">Trạng thái:</span>
            <span className="value">{getStatusBadge(order.status)}</span>
          </div>
          <div className="info-row">
            <span className="label">Ngày đặt:</span>
            <span className="value">
              {new Date(order.created_at).toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Phương thức thanh toán:</span>
            <span className="value">
              {order.payment_method === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : 'VNPay'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Trạng thái thanh toán:</span>
            <span className="value">{getPaymentStatusBadge(order.payment_status)}</span>
          </div>
        </div>

        <div className="info-card">
          <h3>Thông Tin Khách Hàng</h3>
          <div className="info-row">
            <span className="label">Tên:</span>
            <span className="value">{order.customer_name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{order.customer_email}</span>
          </div>
          <div className="info-row">
            <span className="label">Số điện thoại:</span>
            <span className="value">{order.shipping_phone}</span>
          </div>
          <div className="info-row">
            <span className="label">Địa chỉ giao hàng:</span>
            <span className="value">{order.shipping_address}</span>
          </div>
          {order.notes && (
            <div className="info-row">
              <span className="label">Ghi chú:</span>
              <span className="value">{order.notes}</span>
            </div>
          )}
        </div>
      </div>

      <div className="order-items-section">
        <h3>Sản Phẩm Trong Đơn Hàng</h3>
        <table className="order-items-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Đơn giá</th>
              <th>Số lượng</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="product-info">
                    {item.product?.image_url && (
                      <img
                        src={item.product.image_url}
                        alt={item.product_name}
                        className="product-thumb"
                      />
                    )}
                    <span>{item.product_name}</span>
                  </div>
                </td>
                <td>{item.price.toLocaleString('vi-VN')} ₫</td>
                <td>{item.quantity}</td>
                <td>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="order-summary">
          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{order.subtotal.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{order.shipping_fee.toLocaleString('vi-VN')} ₫</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="summary-row" style={{ color: '#dc2626' }}>
              <span>Giảm giá ({order.coupon_code}):</span>
              <span>-{order.discount_amount.toLocaleString('vi-VN')} ₫</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span>{order.total.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
      </div>

      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
        <div className="order-actions">
          <h3>Cập Nhật Trạng Thái Đơn Hàng</h3>
          <div className="status-buttons">
            {order.status === 'PENDING' && (
              <>
                <button
                  onClick={() => updateOrderStatus('PROCESSING')}
                  className="btn btn-info"
                  disabled={updating}
                  style={{ opacity: updating ? 0.6 : 1, cursor: updating ? 'not-allowed' : 'pointer' }}
                >
                  {updating ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
                </button>
                <button
                  onClick={() => updateOrderStatus('CANCELLED')}
                  className="btn btn-danger"
                  disabled={updating}
                  style={{ opacity: updating ? 0.6 : 1, cursor: updating ? 'not-allowed' : 'pointer' }}
                >
                  {updating ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                </button>
              </>
            )}
            {order.status === 'PROCESSING' && (
              <>
                <button
                  onClick={() => updateOrderStatus('COMPLETED')}
                  className="btn btn-success"
                  disabled={updating}
                  style={{ opacity: updating ? 0.6 : 1, cursor: updating ? 'not-allowed' : 'pointer' }}
                >
                  {updating ? 'Đang xử lý...' : 'Đánh dấu hoàn thành'}
                </button>
                <button
                  onClick={() => updateOrderStatus('CANCELLED')}
                  className="btn btn-danger"
                  disabled={updating}
                  style={{ opacity: updating ? 0.6 : 1, cursor: updating ? 'not-allowed' : 'pointer' }}
                >
                  {updating ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Status Update - Chỉ cho COD */}
      {order.payment_method === 'cod' && order.payment_status !== 'paid' && order.status !== 'CANCELLED' && (
        <div className="order-actions" style={{ marginTop: '1.5rem' }}>
          <h3>Cập Nhật Trạng Thái Thanh Toán</h3>
          <div className="status-buttons">
            <button
              onClick={() => updatePaymentStatus('paid')}
              className="btn btn-success"
              disabled={updating}
              style={{ opacity: updating ? 0.6 : 1, cursor: updating ? 'not-allowed' : 'pointer' }}
            >
              {updating ? '⏳ Đang cập nhật...' : '✓ Đánh dấu đã thanh toán'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
