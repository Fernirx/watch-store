import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import Toast from '../../components/Toast';
import './Wishlist.css';

const Wishlist = () => {
  const { wishlist, loading, removeWishlistItem, moveToCart, clearWishlist, fetchWishlist } = useWishlist();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (itemId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?')) {
      try {
        await removeWishlistItem(itemId);
      } catch (error) {
        setToast({ message: 'Không thể xóa: ' + (error.response?.data?.message || error.message), type: 'error' });
      }
    }
  };

  const handleMoveToCart = async (itemId, productName) => {
    try {
      await moveToCart(itemId, 1);
      await fetchCart();
      setToast({ message: `Đã thêm "${productName}" vào giỏ hàng!`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Không thể thêm vào giỏ: ' + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ danh sách yêu thích?')) {
      try {
        await clearWishlist();
      } catch (error) {
        setToast({ message: 'Không thể xóa: ' + (error.response?.data?.message || error.message), type: 'error' });
      }
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  const items = wishlist?.wishlist?.items || [];

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>Danh Sách Yêu Thích</h1>
          {items.length > 0 && (
            <button onClick={handleClearWishlist} className="btn-clear-wishlist">
              Xóa Tất Cả
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty-wishlist">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <h2>Danh sách yêu thích trống</h2>
            <p>Hãy thêm sản phẩm yêu thích để dễ dàng theo dõi!</p>
            <Link to="/products" className="btn-browse">
              Khám Phá Sản Phẩm
            </Link>
          </div>
        ) : (
          <div className="wishlist-items">
            {items.map((item) => {
              const product = item.product;
              const currentPrice = product.sale_price || product.price;

              return (
                <div key={item.id} className="wishlist-item">
                  <Link to={`/products/${product.id}`} className="item-image">
                    <img src={product.image_url || '/placeholder.jpg'} alt={product.name} />
                  </Link>

                  <div className="item-details">
                    <Link to={`/products/${product.id}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    <p className="item-brand">{product.brand?.name}</p>
                    <p className="item-category">{product.category?.name}</p>

                    <div className="item-price">
                      {product.sale_price ? (
                        <>
                          <span className="sale-price">
                            {parseFloat(product.sale_price).toLocaleString('vi-VN')}đ
                          </span>
                          <span className="original-price">
                            {parseFloat(product.price).toLocaleString('vi-VN')}đ
                          </span>
                        </>
                      ) : (
                        <span className="current-price">
                          {parseFloat(product.price).toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>

                    <div className="item-stock">
                      {product.stock_quantity > 0 ? (
                        <span className="in-stock">Còn hàng</span>
                      ) : (
                        <span className="out-of-stock">Hết hàng</span>
                      )}
                    </div>
                  </div>

                  <div className="item-actions">
                    {product.stock_quantity > 0 ? (
                      <button
                        onClick={() => handleMoveToCart(item.id, product.name)}
                        className="btn-add-to-cart"
                      >
                        Thêm Vào Giỏ
                      </button>
                    ) : (
                      <button className="btn-out-of-stock" disabled>
                        Hết Hàng
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="btn-remove"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Wishlist;
