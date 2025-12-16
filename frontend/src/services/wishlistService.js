import axios from '../api/axiosConfig';

const wishlistService = {
  // Get wishlist
  getWishlist: async () => {
    const response = await axios.get('/wishlist');
    return response.data;
  },

  // Add product to wishlist
  addToWishlist: async (product_id) => {
    const response = await axios.post('/wishlist/items', { product_id });
    return response.data;
  },

  // Remove item from wishlist
  removeWishlistItem: async (id) => {
    const response = await axios.delete(`/wishlist/items/${id}`);
    return response.data;
  },

  // Clear wishlist
  clearWishlist: async () => {
    const response = await axios.delete('/wishlist/clear');
    return response.data;
  },

  // Move item to cart
  moveToCart: async (id, quantity = 1) => {
    const response = await axios.post(`/wishlist/items/${id}/move-to-cart`, { quantity });
    return response.data;
  },

  // Check if product is in wishlist
  checkInWishlist: async (productId) => {
    const response = await axios.get(`/wishlist/check/${productId}`);
    return response.data;
  },
};

export default wishlistService;
