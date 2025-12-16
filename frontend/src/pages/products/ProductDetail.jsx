import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]);

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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(product.id, quantity);
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    } catch (error) {
      alert('Không thể thêm vào giỏ hàng: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(product.id, quantity);
      navigate('/cart');
    } catch (error) {
      alert('Không thể thêm vào giỏ hàng: ' + (error.response?.data?.message || error.message));
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

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={product.primary_image || product.image_url || '/placeholder.jpg'}
                alt={product.name}
              />
            </div>
            {images.length > 1 && (
              <div className="thumbnail-images">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url || image}
                    alt={`${product.name} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
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
                  <i className="icon-warranty"></i>
                  <span>Bảo hành: {product.warranty_period}</span>
                </div>
              )}
              {product.origin_country && (
                <div className="highlight-item">
                  <i className="icon-origin"></i>
                  <span>Xuất xứ: {product.origin_country}</span>
                </div>
              )}
              {product.water_resistance && (
                <div className="highlight-item">
                  <i className="icon-water"></i>
                  <span>Chống nước: {product.water_resistance}</span>
                </div>
              )}
            </div>

            {product.description && (
              <div className="description">
                <h3>Mô tả sản phẩm</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Technical Specifications */}
            <div className="technical-specs">
              <h3>Thông số kỹ thuật</h3>
              <div className="specs-grid">
                {/* Movement Section */}
                {product.movement_type && (
                  <div className="spec-section">
                    <h4>Bộ Máy</h4>
                    <div className="spec-item">
                      <span className="spec-label">Loại:</span>
                      <span className="spec-value">{product.movement_type}</span>
                    </div>
                    {product.movement_name && (
                      <div className="spec-item">
                        <span className="spec-label">Model:</span>
                        <span className="spec-value">{product.movement_name}</span>
                      </div>
                    )}
                    {product.power_reserve && (
                      <div className="spec-item">
                        <span className="spec-label">Trữ cót:</span>
                        <span className="spec-value">{product.power_reserve}</span>
                      </div>
                    )}
                    {product.battery_type && (
                      <div className="spec-item">
                        <span className="spec-label">Loại pin:</span>
                        <span className="spec-value">{product.battery_type}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Materials Section */}
                {(product.case_material || product.strap_material || product.glass_material) && (
                  <div className="spec-section">
                    <h4>Chất Liệu</h4>
                    {product.case_material && (
                      <div className="spec-item">
                        <span className="spec-label">Vỏ:</span>
                        <span className="spec-value">{product.case_material}</span>
                      </div>
                    )}
                    {product.strap_material && (
                      <div className="spec-item">
                        <span className="spec-label">Dây:</span>
                        <span className="spec-value">{product.strap_material}</span>
                      </div>
                    )}
                    {product.glass_material && (
                      <div className="spec-item">
                        <span className="spec-label">Kính:</span>
                        <span className="spec-value">{product.glass_material}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Colors Section */}
                {(product.dial_color || product.case_color || product.strap_color) && (
                  <div className="spec-section">
                    <h4>Màu Sắc</h4>
                    {product.dial_color && (
                      <div className="spec-item">
                        <span className="spec-label">Mặt số:</span>
                        <span className="spec-value">{product.dial_color}</span>
                      </div>
                    )}
                    {product.case_color && (
                      <div className="spec-item">
                        <span className="spec-label">Vỏ:</span>
                        <span className="spec-value">{product.case_color}</span>
                      </div>
                    )}
                    {product.strap_color && (
                      <div className="spec-item">
                        <span className="spec-label">Dây:</span>
                        <span className="spec-value">{product.strap_color}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dimensions Section */}
                {(product.case_size || product.case_thickness || product.weight) && (
                  <div className="spec-section">
                    <h4>Kích Thước</h4>
                    {product.case_size && (
                      <div className="spec-item">
                        <span className="spec-label">Đường kính:</span>
                        <span className="spec-value">{product.case_size} mm</span>
                      </div>
                    )}
                    {product.case_thickness && (
                      <div className="spec-item">
                        <span className="spec-label">Độ dày:</span>
                        <span className="spec-value">{product.case_thickness} mm</span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="spec-item">
                        <span className="spec-label">Trọng lượng:</span>
                        <span className="spec-value">{product.weight} g</span>
                      </div>
                    )}
                    {product.gender && (
                      <div className="spec-item">
                        <span className="spec-label">Giới tính:</span>
                        <span className="spec-value">{product.gender}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Features Section */}
                {product.features && product.features.length > 0 && (
                  <div className="spec-section full-width">
                    <h4>Tính Năng Đặc Biệt</h4>
                    <div className="features-list">
                      {product.features.map((feature, index) => (
                        <span key={index} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
      </div>
    </div>
  );
};

export default ProductDetail;
