import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import reviewService from '../services/reviewService';
import './ProductReviews.css';

const ProductReviews = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Filter states
  const [filterRating, setFilterRating] = useState(null);

  // Review form states
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    guest_email: '',
    guest_phone: '',
    guest_name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId, filterRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterRating) filters.rating = filterRating;

      const response = await reviewService.getProductReviews(productId, filters);
      setReviews(response.data.reviews);
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    if (checkingEligibility) return;

    try {
      setCheckingEligibility(true);
      const email = isAuthenticated ? user?.email : reviewForm.guest_email;
      const phone = isAuthenticated ? user?.phone : reviewForm.guest_phone;

      const response = await reviewService.canReview(productId, email, phone);
      setCanReview(response.data.can_review);

      if (!response.data.can_review) {
        if (!response.data.has_purchased) {
          alert('Bạn chưa mua sản phẩm này nên không thể đánh giá.');
        } else if (response.data.has_reviewed) {
          alert('Bạn đã đánh giá sản phẩm này rồi.');
        }
      } else {
        setShowReviewForm(true);
      }
    } catch (error) {
      alert('Lỗi khi kiểm tra: ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const reviewData = {
        product_id: parseInt(productId),
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      };

      if (!isAuthenticated) {
        if (!reviewForm.guest_email && !reviewForm.guest_phone) {
          alert('Vui lòng nhập email hoặc số điện thoại');
          return;
        }
        reviewData.guest_email = reviewForm.guest_email;
        reviewData.guest_phone = reviewForm.guest_phone;
        reviewData.guest_name = reviewForm.guest_name;
      }

      await reviewService.createReview(reviewData);
      alert('Đánh giá của bạn đã được gửi thành công!');

      // Reset form and refresh
      setReviewForm({ rating: 5, comment: '', guest_email: '', guest_phone: '', guest_name: '' });
      setShowReviewForm(false);
      setCanReview(false);
      fetchReviews();
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!statistics || !statistics.distribution) return null;

    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = statistics.distribution[star] || 0;
          const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0;

          return (
            <div key={star} className="rating-bar-row" onClick={() => setFilterRating(filterRating === star ? null : star)}>
              <span className="star-label">{star} ★</span>
              <div className="rating-bar">
                <div className="rating-bar-fill" style={{ width: `${percentage}%` }}></div>
              </div>
              <span className="rating-count">({count})</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="product-reviews">
      <h2>Đánh Giá Sản Phẩm</h2>

      {/* Review Summary */}
      {statistics && (
        <div className="review-summary">
          <div className="average-rating">
            <div className="rating-number">{statistics.average.toFixed(1)}</div>
            {renderStars(Math.round(statistics.average))}
            <div className="total-reviews">{statistics.total} đánh giá</div>
          </div>
          {renderRatingDistribution()}
        </div>
      )}

      {/* Write Review Button */}
      <div className="review-actions">
        {!showReviewForm && (
          <button onClick={checkReviewEligibility} className="btn btn-primary" disabled={checkingEligibility}>
            {checkingEligibility ? 'Đang kiểm tra...' : 'Viết đánh giá'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && canReview && (
        <div className="review-form-container">
          <h3>Viết đánh giá của bạn</h3>
          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="form-group">
              <label>Đánh giá của bạn *</label>
              {renderStars(reviewForm.rating, true, (rating) => setReviewForm({ ...reviewForm, rating }))}
            </div>

            <div className="form-group">
              <label htmlFor="comment">Nhận xét</label>
              <textarea
                id="comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows="4"
                className="form-control"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              />
            </div>

            {!isAuthenticated && (
              <>
                <div className="form-group">
                  <label htmlFor="guest_name">Tên của bạn</label>
                  <input
                    type="text"
                    id="guest_name"
                    value={reviewForm.guest_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, guest_name: e.target.value })}
                    className="form-control"
                    placeholder="Nhập tên"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="guest_email">Email *</label>
                    <input
                      type="email"
                      id="guest_email"
                      value={reviewForm.guest_email}
                      onChange={(e) => setReviewForm({ ...reviewForm, guest_email: e.target.value })}
                      className="form-control"
                      placeholder="Email đã dùng khi mua hàng"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="guest_phone">Số điện thoại *</label>
                    <input
                      type="text"
                      id="guest_phone"
                      value={reviewForm.guest_phone}
                      onChange={(e) => setReviewForm({ ...reviewForm, guest_phone: e.target.value })}
                      className="form-control"
                      placeholder="SĐT đã dùng khi mua hàng"
                    />
                  </div>
                </div>
                <small style={{ color: '#64748b' }}>* Email hoặc số điện thoại phải trùng với thông tin khi đặt hàng</small>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewForm({ rating: 5, comment: '', guest_email: '', guest_phone: '', guest_name: '' });
                }}
                className="btn btn-secondary"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      {filterRating && (
        <div className="review-filter-active">
          Đang lọc: {filterRating} sao
          <button onClick={() => setFilterRating(null)} className="btn-clear-filter">✕</button>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <div className="loading">Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            {filterRating ? `Chưa có đánh giá ${filterRating} sao` : 'Chưa có đánh giá nào. Hãy là người đầu tiên!'}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <strong>{review.reviewer_name}</strong>
                  {review.is_verified_purchase && <span className="verified-badge">✓ Đã mua hàng</span>}
                </div>
                {renderStars(review.rating)}
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
              <div className="review-date">
                {new Date(review.created_at).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
