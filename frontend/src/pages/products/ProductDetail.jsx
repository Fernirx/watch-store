import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

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

  const currentPrice = product.sale_price || product.price;
  const images = product.images || [];

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={images[selectedImage]?.image_url || '/placeholder.jpg'}
                alt={product.name}
              />
            </div>
            {images.length > 1 && (
              <div className="thumbnail-images">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image.image_url}
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
            <h1>{product.name}</h1>
            <p className="brand">Thương hiệu: {product.brand?.name}</p>
            <p className="category">Danh mục: {product.category?.name}</p>

            <div className="price-section">
              {product.sale_price ? (
                <>
                  <span className="sale-price">
                    {parseFloat(product.sale_price).toLocaleString('vi-VN')}đ
                  </span>
                  <span className="original-price">
                    {parseFloat(product.price).toLocaleString('vi-VN')}đ
                  </span>
                  <span className="discount-percent">
                    -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
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

            {product.description && (
              <div className="description">
                <h3>Mô tả sản phẩm</h3>
                <p>{product.description}</p>
              </div>
            )}

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
