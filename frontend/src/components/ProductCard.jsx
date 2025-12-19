import { Link } from 'react-router-dom';

const ProductCard = ({ product, isInWishlist, onWishlistToggle }) => {
  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onWishlistToggle(e, product);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`}>
        <div className="product-image">
          <button
            className={`wishlist-heart ${isInWishlist(product.id) ? 'active' : ''}`}
            onClick={handleWishlistClick}
            title={isInWishlist(product.id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <img
            src={product.image_url || '/placeholder.jpg'}
            alt={product.name}
          />
          {product.sale_price && (
            <span className="sale-badge">Sale</span>
          )}
          {product.stock_quantity === 0 && (
            <span className="out-of-stock-badge">Hết hàng</span>
          )}
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <span className="low-stock-badge">Còn {product.stock_quantity}</span>
          )}
        </div>
        <div className="product-info">
          <h3>{product.name}</h3>
          <p className="brand">{product.brand?.name}</p>
          <div className="price">
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
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
