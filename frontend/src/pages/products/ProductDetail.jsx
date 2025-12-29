import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import Toast from '../../components/Toast';
import ProductReviews from '../../components/ProductReviews';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState(null);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToWishlist, removeWishlistItem, isInWishlist, wishlist } = useWishlist();

  useEffect(() => {
    fetchProduct();
  }, [id]);
  useEffect(() => {
    if (product) {
      setIsWishlisted(isInWishlist(product.id));
    }
  }, [product, wishlist]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProduct(id);
      setProduct(data.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Không tìm thấy sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
      setToast({ message: 'Đã thêm sản phẩm vào giỏ hàng!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Không thể thêm vào giỏ hàng: ' + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product.id, quantity);
      navigate('/checkout');
    } catch (error) {
      setToast({ message: 'Không thể thêm vào giỏ hàng: ' + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        const wishlistItem = wishlist?.wishlist?.items.find(
          item => item.product_id === product.id
        );
        if (wishlistItem) {
          await removeWishlistItem(wishlistItem.id);
          setIsWishlisted(false);
        }
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);
      }
    } catch (error) {
      setToast({ message: 'Lỗi: ' + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error || !product) {
    return <div className="error-page">{error}</div>;
  }

  const currentPrice = product.original_price && product.price < product.original_price
    ? product.price
    : product.price;
  const images = product.images || [];

  // Find primary image index
  const primaryIndex = images.findIndex(img => img.is_primary);
  const mainImageUrl = images[selectedImage]?.url || product.primary_image || product.image_url || '/placeholder.jpg';

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={mainImageUrl}
                alt={product.name}
              />
            </div>
            {images.length > 1 && (
              <div className="thumbnail-images">
                {images.map((image, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: selectedImage === index ? '3px solid #4CAF50' : '2px solid #ddd',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image.url || image}
                      alt={`${product.name} ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {image.is_primary && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        background: '#4CAF50',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        CHÍNH
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-details">
            {/* Badges */}
            <div className="product-badges">
              {product.is_new && <span className="badge badge-new">MỚI</span>}
              {product.is_on_sale && <span className="badge badge-sale">GIẢM GIÁ</span>}
              {product.is_featured && <span className="badge badge-featured">NỔI BẬT</span>}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              className={`btn-wishlist ${isWishlisted ? 'active' : ''}`}
              title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {isWishlisted ? 'Đã Yêu Thích' : 'Yêu Thích'}
            </button>

            <h1>{product.name}</h1>
            {product.code && <p className="product-code">Mã SP: {product.code}</p>}
            <p className="brand">Thương hiệu: <strong>{product.brand?.name}</strong></p>
            <p className="category">Danh mục: <strong>{product.category?.name}</strong></p>

            <div className="price-section">
              {product.original_price && product.price < product.original_price ? (
                <>
                  <span className="sale-price">
                    {parseFloat(product.price).toLocaleString('vi-VN')}đ
                  </span>
                  <span className="original-price">
                    {parseFloat(product.original_price).toLocaleString('vi-VN')}đ
                  </span>
                  <span className="discount-percent">
                    -{product.discount_percentage}%
                  </span>
                </>
              ) : (
                <span className="current-price">
                  {parseFloat(product.price).toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>

            <div className="stock-info">
              {product.stock_quantity > 0 ? (
                <span className="in-stock">Còn hàng ({product.stock_quantity} sản phẩm)</span>
              ) : (
                <span className="out-of-stock">Hết hàng</span>
              )}
            </div>

            {/* Product Highlights */}
            <div className="product-highlights">
              {product.warranty_period && (
                <div className="highlight-item">
                  <span>Bảo hành: {product.warranty_period}</span>
                </div>
              )}
              {product.origin_country && (
                <div className="highlight-item">
                  <span>Xuất xứ: {product.origin_country}</span>
                </div>
              )}
              {product.water_resistance && (
                <div className="highlight-item">
                  <span>Chống nước: {product.water_resistance}</span>
                </div>
              )}
            </div>

            {product.stock_quantity > 0 ? (
              <div className="purchase-section">
                <div className="quantity-selector">
                  <label>Số lượng:</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                      min="1"
                      max={product.stock_quantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      disabled={quantity >= product.stock_quantity}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="action-buttons">
                  <button onClick={handleAddToCart} className="btn-add-to-cart">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.99-1.72L23 6H6" />
                    </svg>
                    Thêm Vào Giỏ
                  </button>
                  <button onClick={handleBuyNow} className="btn-buy-now">
                    Mua Ngay
                  </button>
                </div>
              </div>
            ) : (
              <div className="out-of-stock-message">
                <p>Sản phẩm hiện đã hết hàng</p>
                <button onClick={() => window.history.back()} className="btn-back">
                  Quay Lại
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Description and Specifications */}
        <div className="product-full-info">
          {product.description && (
            <div className="description-full">
              <h3>Mô tả sản phẩm</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Technical Specifications Table */}
          <div className="technical-specs-full">
            <h3>Thông số kỹ thuật</h3>
            <table className="specs-table">
              <tbody>
                {/* Movement Section */}
                {product.movement_type && (
                  <>
                    <tr className="spec-category-row">
                      <td colSpan="2"><strong>Bộ Máy</strong></td>
                    </tr>
                    <tr>
                      <td className="spec-label">Loại</td>
                      <td className="spec-value">{product.movement_type}</td>
                    </tr>
                    {product.movement_name && (
                      <tr>
                        <td className="spec-label">Model</td>
                        <td className="spec-value">{product.movement_name}</td>
                      </tr>
                    )}
                    {product.power_reserve && (
                      <tr>
                        <td className="spec-label">Trữ cót</td>
                        <td className="spec-value">{product.power_reserve}</td>
                      </tr>
                    )}
                    {product.battery_type && (
                      <tr>
                        <td className="spec-label">Loại pin</td>
                        <td className="spec-value">{product.battery_type}</td>
                      </tr>
                    )}
                  </>
                )}

                {/* Materials Section */}
                {(product.case_material || product.strap_material || product.glass_material) && (
                  <>
                    <tr className="spec-category-row">
                      <td colSpan="2"><strong>Chất Liệu</strong></td>
                    </tr>
                    {product.case_material && (
                      <tr>
                        <td className="spec-label">Vỏ</td>
                        <td className="spec-value">{product.case_material}</td>
                      </tr>
                    )}
                    {product.strap_material && (
                      <tr>
                        <td className="spec-label">Dây</td>
                        <td className="spec-value">{product.strap_material}</td>
                      </tr>
                    )}
                    {product.glass_material && (
                      <tr>
                        <td className="spec-label">Kính</td>
                        <td className="spec-value">{product.glass_material}</td>
                      </tr>
                    )}
                  </>
                )}

                {/* Colors Section */}
                {(product.dial_color || product.case_color || product.strap_color) && (
                  <>
                    <tr className="spec-category-row">
                      <td colSpan="2"><strong>Màu Sắc</strong></td>
                    </tr>
                    {product.dial_color && (
                      <tr>
                        <td className="spec-label">Mặt số</td>
                        <td className="spec-value">{product.dial_color}</td>
                      </tr>
                    )}
                    {product.case_color && (
                      <tr>
                        <td className="spec-label">Vỏ</td>
                        <td className="spec-value">{product.case_color}</td>
                      </tr>
                    )}
                    {product.strap_color && (
                      <tr>
                        <td className="spec-label">Dây</td>
                        <td className="spec-value">{product.strap_color}</td>
                      </tr>
                    )}
                  </>
                )}

                {/* Dimensions Section */}
                {(product.case_size || product.case_thickness || product.weight || product.gender) && (
                  <>
                    <tr className="spec-category-row">
                      <td colSpan="2"><strong>Kích Thước & Thông Tin</strong></td>
                    </tr>
                    {product.case_size && (
                      <tr>
                        <td className="spec-label">Đường kính</td>
                        <td className="spec-value">{product.case_size} mm</td>
                      </tr>
                    )}
                    {product.case_thickness && (
                      <tr>
                        <td className="spec-label">Độ dày</td>
                        <td className="spec-value">{product.case_thickness} mm</td>
                      </tr>
                    )}
                    {product.weight && (
                      <tr>
                        <td className="spec-label">Trọng lượng</td>
                        <td className="spec-value">{product.weight} g</td>
                      </tr>
                    )}
                    {product.gender && (
                      <tr>
                        <td className="spec-label">Giới tính</td>
                        <td className="spec-value">{product.gender}</td>
                      </tr>
                    )}
                  </>
                )}

                {/* Features Section */}
               
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <ProductReviews productId={id} />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
