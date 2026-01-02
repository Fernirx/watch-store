import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import reviewService from '../../services/reviewService';
import productService from '../../services/productService';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    product_id: '',
    rating: '',
    verified: '',
    search: '',
    per_page: 20,
  });

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getAllReviews(filters);
      setReviews(response.data.data || []);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Lỗi khi tải đánh giá: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ per_page: 1000 });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      await reviewService.deleteReview(id);
      alert('Xóa đánh giá thành công!');
      fetchReviews();
    } catch (error) {
      alert('Không thể xóa: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleExport = async () => {
    try {
      const response = await reviewService.exportReviews(filters);
      const data = response.data;

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reviews_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      alert('Lỗi khi xuất báo cáo: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderStars = (rating) => {
    return (
      <span className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>★</span>
        ))}
      </span>
    );
  };

  if (loading && reviews.length === 0) {
    return <div className="loading"><div className="spinner"></div><p>Đang tải...</p></div>;
  }

  return (
    <div className="admin-reviews">
      <div className="admin-page-header">
        <div>
          <h1>Quản Lý Đánh Giá</h1>
          <div className="admin-breadcrumb">
            <Link to="/admin">Dashboard</Link>
            <span>/</span>
            <span>Đánh giá</span>
          </div>
        </div>
        <button onClick={handleExport} className="btn btn-secondary">
          <i className="fas fa-download"></i> Xuất báo cáo
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="filter-product">Sản phẩm</label>
            <select
              id="filter-product"
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
              className="form-control"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-rating">Số sao</label>
            <select
              id="filter-rating"
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="form-control"
            >
              <option value="">Tất cả</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-search">Tìm kiếm</label>
            <input
              type="text"
              id="filter-search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="form-control"
              placeholder="Email, nội dung..."
            />
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sản phẩm</th>
              <th>Người đánh giá</th>
              <th>Số sao</th>
              <th>Nhận xét</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>Chưa có đánh giá nào</h3>
                  </div>
                </td>
              </tr>
            ) : (
              reviews.map(review => (
                <tr key={review.id}>
                  <td>{review.id}</td>
                  <td>
                    <strong>{review.product?.name || 'N/A'}</strong>
                  </td>
                  <td>
                    <div>
                      <strong>{review.reviewer_name}</strong>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {review.user ? review.user.email : (review.guest_email || 'N/A')}
                      </div>
                    </div>
                  </td>
                  <td>{renderStars(review.rating)}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {review.comment || '-'}
                    </div>
                  </td>
                  <td>
                    {new Date(review.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div className="table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleDelete(review.id)} className="btn-icon delete">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: '#64748b' }}>
            Trang {pagination.current_page} / {pagination.last_page} - Tổng {pagination.total} đánh giá
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
