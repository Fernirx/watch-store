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
                <td>{Math.round(parseFloat(item.price)).toLocaleString('vi-VN')}đ</td>
                <td>{item.quantity}</td>
                <td>{Math.round(parseFloat(item.price) * item.quantity).toLocaleString('vi-VN')}đ</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="order-summary">
          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{Math.round(parseFloat(order.subtotal)).toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{Math.round(parseFloat(order.shipping_fee)).toLocaleString('vi-VN')}đ</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="summary-row" style={{ color: '#dc2626' }}>
              <span>Giảm giá ({order.coupon_code}):</span>
              <span>-{Math.round(parseFloat(order.discount_amount)).toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span>{Math.round(parseFloat(order.total)).toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </div>

      {/* Status Management Section */}
      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            📋 Quản Lý Đơn Hàng
          </h3>

          {/* Status Flow Visualization */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '8px',
            position: 'relative'
          }}>
            {/* Step 1: PENDING */}
            <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: order.status === 'PENDING' ? '#fbbf24' : '#22c55e',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontWeight: 'bold'
              }}>
                {order.status === 'PENDING' ? '1' : '✓'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: order.status === 'PENDING' ? '#f59e0b' : '#64748b' }}>
                Chờ xử lý
              </div>
            </div>

            {/* Arrow 1 */}
            <div style={{ flex: 0.3, height: '2px', background: order.status !== 'PENDING' ? '#22c55e' : '#cbd5e1', margin: '0 -10px' }} />

            {/* Step 2: PROCESSING */}
            <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: order.status === 'PROCESSING' ? '#3b82f6' : (order.status === 'PENDING' ? '#e2e8f0' : '#22c55e'),
                color: order.status === 'PROCESSING' ? 'white' : (order.status === 'PENDING' ? '#94a3b8' : 'white'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontWeight: 'bold'
              }}>
                {order.status === 'COMPLETED' ? '✓' : order.status === 'PROCESSING' ? '2' : '2'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: order.status === 'PROCESSING' ? '#3b82f6' : '#64748b' }}>
                Đang xử lý
              </div>
            </div>

            {/* Arrow 2 */}
            <div style={{ flex: 0.3, height: '2px', background: order.status === 'COMPLETED' ? '#22c55e' : '#cbd5e1', margin: '0 -10px' }} />

            {/* Step 3: COMPLETED */}
            <div style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#e2e8f0',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontWeight: 'bold'
              }}>
                3
              </div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>
                Hoàn thành
              </div>
            </div>
          </div>

          {/* Payment Status Check */}
          {order.payment_status !== 'paid' && (
            <div style={{
              padding: '16px',
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>💰</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                    ⚠️ Chưa thanh toán
                  </div>
                  <div style={{ fontSize: '14px', color: '#78350f', lineHeight: '1.5' }}>
                    Đơn hàng này chưa được thanh toán. {order.status === 'PROCESSING' && 'Vui lòng đánh dấu "Đã thanh toán" bên dưới trước khi hoàn thành đơn.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {order.status === 'PENDING' && (
              <>
                <button
                  onClick={() => updateOrderStatus('PROCESSING')}
                  disabled={updating}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '12px 24px',
                    background: updating ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: updating ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {updating ? '⏳ Đang xử lý...' : '✓ Xác nhận đơn hàng'}
                </button>
                <button
                  onClick={() => updateOrderStatus('CANCELLED')}
                  disabled={updating}
                  style={{
                    padding: '12px 24px',
                    background: 'white',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.6 : 1
                  }}
                >
                  {updating ? '⏳ Đang xử lý...' : '✗ Hủy đơn'}
                </button>
              </>
            )}

            {order.status === 'PROCESSING' && (
              <>
                <button
                  onClick={() => updateOrderStatus('COMPLETED')}
                  disabled={updating || order.payment_status !== 'paid'}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '12px 24px',
                    background: (updating || order.payment_status !== 'paid')
                      ? '#cbd5e1'
                      : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (updating || order.payment_status !== 'paid') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: (updating || order.payment_status !== 'paid') ? 'none' : '0 4px 12px rgba(34, 197, 94, 0.3)'
                  }}
                  title={order.payment_status !== 'paid' ? 'Vui lòng đánh dấu đã thanh toán trước' : ''}
                >
                  {updating ? '⏳ Đang xử lý...' : (order.payment_status !== 'paid' ? '🔒 Hoàn thành (Chưa thanh toán)' : '✓ Hoàn thành đơn hàng')}
                </button>
                <button
                  onClick={() => updateOrderStatus('CANCELLED')}
                  disabled={updating}
                  style={{
                    padding: '12px 24px',
                    background: 'white',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.6 : 1
                  }}
                >
                  {updating ? '⏳ Đang xử lý...' : '✗ Hủy đơn'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Status Update - Chỉ cho COD */}
      {order.payment_method === 'cod' && order.payment_status !== 'paid' && order.status !== 'CANCELLED' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '2px solid #f59e0b'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💳 Cập Nhật Thanh Toán (COD)
          </h3>

          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
            Khi khách hàng đã thanh toán tiền mặt khi nhận hàng, vui lòng đánh dấu bên dưới.
          </p>

          <button
            onClick={() => updatePaymentStatus('paid')}
            disabled={updating}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: updating ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: updating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: updating ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {updating ? (
              <>⏳ Đang cập nhật...</>
            ) : (
              <>✓ Xác nhận đã nhận tiền</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
