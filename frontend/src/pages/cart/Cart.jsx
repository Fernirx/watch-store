import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const Cart = () => {
  const { cart, loading, subtotal, updateCartItem, removeCartItem, clearCart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

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
      } catch (error) {
        alert('Không thể xóa giỏ hàng: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return <div className="loading">Đang tải giỏ hàng...</div>;
  }

  // cart.cart contains the actual cart with items
  const cartItems = cart?.cart?.items || [];

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
          <h1>Giỏ Hàng ({cartItems.length})</h1>
          <button onClick={handleClearCart} className="btn-clear-cart">
            Xóa Tất Cả
          </button>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item) => {
              const product = item.product;
              const price = product.sale_price || product.price;

              return (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    <img
                      src={product.images?.[0]?.image_url || '/placeholder.jpg'}
                      alt={product.name}
                    />
                  </div>

                  <div className="item-details">
                    <Link to={`/products/${product.id}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    <p className="brand">{product.brand?.name}</p>
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
            <h3>Tổng Đơn Hàng</h3>

            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <div className="summary-row total">
              <span>Tổng cộng:</span>
              <span>{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>

            <Link to="/checkout" className="btn-checkout">
              Thanh Toán
            </Link>

            <Link to="/products" className="btn-continue-shopping">
              Tiếp Tục Mua Sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
