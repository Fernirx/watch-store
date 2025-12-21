import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    try {
      console.log('🛒 Fetching cart, isAuthenticated:', isAuthenticated);
      setLoading(true);
      const response = await cartService.getCart(isAuthenticated);
      console.log('🛒 Cart fetched:', response.data);
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch cart for both authenticated and guest users
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product_id, quantity = 1) => {
    const data = await cartService.addToCart(product_id, quantity, isAuthenticated);
    await fetchCart();
    return data;
  };

  const updateCartItem = async (id, quantity) => {
    const data = await cartService.updateCartItem(id, quantity, isAuthenticated);
    await fetchCart();
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
