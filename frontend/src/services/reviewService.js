import axios from '../api/axiosConfig';

const reviewService = {
  // Customer endpoints
  getProductReviews: async (productId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.rating) params.append('rating', filters.rating);
    if (filters.verified_only) params.append('verified_only', filters.verified_only);

    const response = await axios.get(`/products/${productId}/reviews?${params}`);
    return response.data;
  },

  createReview: async (reviewData) => {
    const response = await axios.post('/reviews', reviewData);
    return response.data;
  },

  canReview: async (productId, email = null) => {
    const response = await axios.post('/reviews/can-review', {
      product_id: productId,
      email,
    });
    return response.data;
  },

  // Admin endpoints
  getAllReviews: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.rating) params.append('rating', filters.rating);
    if (filters.verified !== undefined) params.append('verified', filters.verified);
    if (filters.search) params.append('search', filters.search);
    if (filters.per_page) params.append('per_page', filters.per_page);

    const response = await axios.get(`/reviews?${params}`);
    return response.data;
  },

  updateReview: async (id, data) => {
    const response = await axios.put(`/reviews/${id}`, data);
    return response.data;
  },

  deleteReview: async (id) => {
    const response = await axios.delete(`/reviews/${id}`);
    return response.data;
  },

  exportReviews: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.rating) params.append('rating', filters.rating);
    if (filters.verified !== undefined) params.append('verified', filters.verified);

    const response = await axios.get(`/reviews/export?${params}`);
    return response.data;
  },
};

export default reviewService;
