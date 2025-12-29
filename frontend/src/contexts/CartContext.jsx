import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ cart: { items: [] }, items_count: 0, subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const fetchingRef = useRef(false);

  const fetchCart = useCallback(async (silent = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log('🚫 Already fetching cart, skipping duplicate call');
      return;
    }

    fetchingRef.current = true;
    try {
      console.log('🛒 Fetching cart, isAuthenticated:', isAuthenticated);
      if (!silent) setLoading(true);
      const response = await cartService.getCart(isAuthenticated);
      console.log('🛒 Cart fetched successfully:', response.data);
      setCart(response.data);
    } catch (error) {
      console.error('❌ Error fetching cart:', error);

      // Nếu lỗi 401 (token hết hạn) và đang nghĩ là authenticated, thử lại với guest cart
      if (error.response?.status === 401 && isAuthenticated) {
        console.warn('⚠️ Token expired, falling back to guest cart...');
        try {
          const guestResponse = await cartService.getCart(false);
          console.log('🛒 Guest cart fetched:', guestResponse.data);
          setCart(guestResponse.data);
        } catch (guestError) {
          console.error('❌ Error fetching guest cart:', guestError);
          // Set empty cart structure instead of null
          setCart({ cart: { items: [] }, items_count: 0, subtotal: 0 });
        }
      } else {
        // Set empty cart structure instead of null
        setCart({ cart: { items: [] }, items_count: 0, subtotal: 0 });
      }
    } finally {
      if (!silent) setLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthenticated]);

  // Fetch cart on mount and when auth changes
  useEffect(() => {
    // Wait for auth to finish loading before fetching cart
    if (authLoading) {
      console.log('⏳ Waiting for auth to finish loading...');
      return;
    }

    console.log('🔄 CartContext useEffect triggered, isAuthenticated:', isAuthenticated);
    fetchCart();
  }, [isAuthenticated, authLoading, fetchCart]);

  const addToCart = async (product_id, quantity = 1) => {
    console.log('🛒 CartContext.addToCart() - START', { product_id, quantity, isAuthenticated });
    try {
      const data = await cartService.addToCart(product_id, quantity, isAuthenticated);
      console.log('✅ CartContext.addToCart() - Product added, now fetching cart');
      await fetchCart();
      return data;
    } catch (error) {
      console.error('❌ CartContext.addToCart() - Error:', error);
      throw error;
    }
  };

  const updateCartItem = async (id, quantity) => {
    const data = await cartService.updateCartItem(id, quantity, isAuthenticated);
    await fetchCart(true); // Silent fetch to avoid full page reload
    return data;
  };

  const removeCartItem = async (id) => {
    const data = await cartService.removeCartItem(id, isAuthenticated);
    await fetchCart();
    return data;
  };

  const clearCart = async () => {
    const data = await cartService.clearCart(isAuthenticated);
    await fetchCart();
    return data;
  };

  const cartItemsCount = cart?.items_count || 0;
  const subtotal = cart?.subtotal || 0;

  const value = {
    cart,
    loading,
    cartItemsCount,
    subtotal,
    fetchCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
