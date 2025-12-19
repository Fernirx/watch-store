import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData, brandsData] = await Promise.all([
        productService.getProducts({ is_featured: 1 }),
        productService.getCategories(),
        productService.getBrands(),
      ]);

      // productsData.data chứa pagination object, productsData.data.data chứa mảng products
      setProducts(productsData.data?.data || []);
      setCategories(categoriesData.data || []);
      setBrands(brandsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="homepage">

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Danh Mục Sản Phẩm</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="category-card"
            >
              <h3>{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <h2>Sản Phẩm Nổi Bật</h2>
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <Link to={`/products/${product.id}`}>
                <div className="product-image">
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
          ))}
        </div>
      </section>

      {/* Brands Section */}
      <section className="brands-section">
        <h2>Thương Hiệu</h2>
        <div className="brands-grid">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/products?brand=${brand.id}`}
              className="brand-card"
            >
              {brand.logo_url ? (
                <img style={{ width: '100px', maxHeight: '50px', objectFit: 'contain' }} src={brand.logo_url} alt={brand.name} />
              ) : (
                <h3>{brand.name}</h3>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
