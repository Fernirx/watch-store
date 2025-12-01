import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/orders');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Chờ xử lý', class: 'badge-warning' },
      processing: { label: '🔄 Đang xử lý', class: 'badge-info' },
      shipped: { label: '🚚 Đang giao', class: 'badge-info' },
      delivered: { label: '✅ Đã giao', class: 'badge-success' },
      cancelled: { label: '❌ Đã hủy', class: 'badge-danger' },
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>🛒 Quản Lý Đơn Hàng</h1>
          <div className="admin-breadcrumb">
            <Link to="/admin">Dashboard</Link>
            <span>/</span>
            <span>Đơn hàng</span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Số điện thoại</th>
              <th>Tổng tiền</th>
              <th>Trạng thái ĐH</th>
              <th>Thanh toán</th>
              <th>Ngày đặt</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🛒</div>
                    <h3>Chưa có đơn hàng nào</h3>
                    <p>Đơn hàng từ khách hàng sẽ hiển thị ở đây</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: '600', color: '#667eea' }}>#{order.id}</td>
                  <td style={{ fontWeight: '600' }}>{order.user?.name || 'Khách'}</td>
                  <td>{order.shipping_phone}</td>
                  <td style={{ fontWeight: '600', color: '#1e293b' }}>
                    {order.total_price.toLocaleString('vi-VN')}₫
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>{getPaymentStatusBadge(order.payment_status)}</td>
                  <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {formatDate(order.created_at)}
                  </td>
                  <td>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      👁️ Chi tiết
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
