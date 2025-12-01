import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axiosConfig';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      await axios.put(`/orders/${id}/status`, { status: newStatus });
      alert('Cập nhật trạng thái đơn hàng thành công!');
      fetchOrder();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Chờ xử lý', class: 'badge-warning' },
      processing: { label: 'Đang xử lý', class: 'badge-info' },
      shipped: { label: 'Đang giao', class: 'badge-primary' },
      delivered: { label: 'Đã giao', class: 'badge-success' },
      cancelled: { label: 'Đã hủy', class: 'badge-danger' },
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
              {order.payment_method === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : order.payment_method}
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3>Thông Tin Khách Hàng</h3>
          <div className="info-row">
            <span className="label">Tên:</span>
            <span className="value">{order.user?.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{order.user?.email}</span>
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
            <span>{order.subtotal_price.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{order.shipping_fee.toLocaleString('vi-VN')} ₫</span>
          </div>
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span>{order.total_price.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
      </div>

      {order.status !== 'cancelled' && order.status !== 'delivered' && (
        <div className="order-actions">
          <h3>Cập Nhật Trạng Thái</h3>
          <div className="status-buttons">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => updateOrderStatus('processing')}
                  className="btn btn-info"
                >
                  Xác nhận đơn hàng
                </button>
                <button
                  onClick={() => updateOrderStatus('cancelled')}
                  className="btn btn-danger"
                >
                  Hủy đơn hàng
                </button>
              </>
            )}
            {order.status === 'processing' && (
              <button
                onClick={() => updateOrderStatus('shipped')}
                className="btn btn-primary"
              >
                Chuyển sang đang giao hàng
              </button>
            )}
            {order.status === 'shipped' && (
              <button
                onClick={() => updateOrderStatus('delivered')}
                className="btn btn-success"
              >
                Đánh dấu đã giao hàng
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
