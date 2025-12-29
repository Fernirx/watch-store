import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Cart.css';

const Cart = () => {
  const { cart, loading, subtotal, updateCartItem, removeCartItem, clearCart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  // Auto-select all available items when cart loads
  useEffect(() => {
    if (cart?.cart?.items) {
      const availableItemIds = cart.cart.items
        .filter(item => item.is_available !== false)
        .map(item => item.id);
      setSelectedItems(availableItemIds);
    }
  }, [cart?.cart?.items]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      alert('Không thể cập nhật số lượng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await removeCartItem(itemId);
      } catch (error) {
        alert('Không thể xóa sản phẩm: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleClearCart = async () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      try {
        await clearCart();
        setSelectedItems([]);
      } catch (error) {
        alert('Không thể xóa giỏ hàng: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const availableItems = cartItems.filter(item => item.is_available !== false);
    if (selectedItems.length === availableItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableItems.map(item => item.id));
    }
  };

  const calculateSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => {
        const price = item.product.sale_price || item.product.price;
        return total + (parseFloat(price) * item.quantity);
      }, 0);
  };

  if (loading) {
    return <div className="loading">Đang tải giỏ hàng...</div>;
  }

  // cart.cart contains the actual cart with items
  const cartItems = cart?.cart?.items || [];
  const hasOutOfStock = cart?.has_out_of_stock || false;
  const availableItems = cartItems.filter(item => item.is_available !== false);
  const allAvailableSelected = availableItems.length > 0 && selectedItems.length === availableItems.length;
  const selectedTotal = calculateSelectedTotal();

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <div className="container">
          <h2>Giỏ hàng trống</h2>
          <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
          <Link to="/products" className="btn-primary">
            Tiếp Tục Mua Sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Giỏ Hàng Của Tôi</h1>
          <span className="cart-count">{cartItems.length} sản phẩm</span>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {/* Select All Header */}
            <div className="cart-items-header">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={allAvailableSelected}
                  onChange={handleSelectAll}
                  disabled={availableItems.length === 0}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">
                  Chọn tất cả ({availableItems.length} sản phẩm)
                </span>
              </label>
              <button onClick={handleClearCart} className="btn-clear-cart">
                Xóa giỏ hàng
              </button>
            </div>

            {cartItems.map((item) => {
              const product = item.product;
              const price = product.sale_price || product.price;
              const isAvailable = item.is_available !== false;
              const isSelected = selectedItems.includes(item.id);

              return (
                <div key={item.id} className={`cart-item ${!isAvailable ? 'out-of-stock' : ''} ${isSelected ? 'selected' : ''}`}>
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(item.id)}
                      disabled={!isAvailable}
                    />
                    <span className="checkmark"></span>
                  </label>

                  <div className="item-image">
                    <img
                      src={product.image_url || '/placeholder.jpg'}
                      alt={product.name}
                    />
                    {!isAvailable && (
                      <div className="out-of-stock-overlay">Hết hàng</div>
                    )}
                  </div>

                  <div className="item-details">
                    <Link to={`/products/${product.id}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    <p className="brand">{product.brand?.name}</p>
                    {!isAvailable && item.stock_message && (
                      <div className="stock-warning">
                        ⚠️ {item.stock_message}
                      </div>
                    )}
                  </div>

                  <div className="item-price">
                    {parseFloat(price).toLocaleString('vi-VN')}đ
                  </div>

                  <div className="item-quantity">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      min="1"
                      max={product.stock_quantity}
                    />
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= product.stock_quantity}
                    >
                      +
                    </button>
                  </div>

                  <div className="item-total">
                    {(parseFloat(price) * item.quantity).toLocaleString('vi-VN')}đ
                  </div>

                  <button
                    className="item-remove"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h3>Thông Tin Đơn Hàng</h3>

            <div className="summary-details">
              <div className="summary-row">
                <span>Sản phẩm đã chọn:</span>
                <span className="highlight">{selectedItems.length} sản phẩm</span>
              </div>

              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{selectedTotal.toLocaleString('vi-VN')}₫</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Tổng cộng:</span>
                <span className="total-price">{selectedTotal.toLocaleString('vi-VN')}₫</span>
              </div>

              <div className="summary-note">
                (Đã bao gồm VAT nếu có)
              </div>
            </div>

            {selectedItems.length === 0 ? (
              <button className="btn-checkout disabled" disabled>
                Vui lòng chọn sản phẩm
              </button>
            ) : (
              <Link to="/checkout" state={{ selectedItems }} className="btn-checkout">
                Tiến Hành Thanh Toán ({selectedItems.length})
              </Link>
            )}

            <Link to="/products" className="btn-continue-shopping">
              ← Tiếp Tục Mua Sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
