import { createContext, useContext, useState, useEffect } from 'react';
import wishlistService from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchWishlist = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await wishlistService.getWishlist();
      setWishlist(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlist(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlist(null);
    }
  }, [isAuthenticated]);

  const addToWishlist = async (product_id) => {
    const data = await wishlistService.addToWishlist(product_id);
    await fetchWishlist();
    return data;
  };

  const removeWishlistItem = async (id) => {
    const data = await wishlistService.removeWishlistItem(id);
    await fetchWishlist();
    return data;
  };

  const clearWishlist = async () => {
    const data = await wishlistService.clearWishlist();
    await fetchWishlist();
    return data;
  };

  const moveToCart = async (id, quantity = 1) => {
    const data = await wishlistService.moveToCart(id, quantity);
    await fetchWishlist();
    return data;
  };

  const isInWishlist = (productId) => {
    if (!wishlist?.wishlist?.items) return false;
    return wishlist.wishlist.items.some(item => item.product_id === productId);
  };

  const wishlistItemsCount = wishlist?.items_count || 0;

  const value = {
    wishlist,
    loading,
    wishlistItemsCount,
    fetchWishlist,
    addToWishlist,
    removeWishlistItem,
    clearWishlist,
    moveToCart,
    isInWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
