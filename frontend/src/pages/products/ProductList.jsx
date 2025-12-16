import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToWishlist, removeWishlistItem, isInWishlist, wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const selectedCategory = searchParams.get('category');
  const selectedBrand = searchParams.get('brand');
  const searchQuery = searchParams.get('search');
  const stockFilter = searchParams.get('stock');
  const movementFilter = searchParams.get('movement');
  const genderFilter = searchParams.get('gender');
  const priceRange = searchParams.get('price_range');

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedBrand, searchQuery, stockFilter, movementFilter, genderFilter, priceRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand_id = selectedBrand;
      if (searchQuery) params.search = searchQuery;
      if (stockFilter === 'in_stock') params.in_stock = true;
      if (movementFilter) params.movement_type = movementFilter;
      if (genderFilter) params.gender = genderFilter;

      // Price range handling
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        if (min) params.min_price = min;
        if (max && max !== 'up') params.max_price = max;
      }

      const [productsData, categoriesData, brandsData] = await Promise.all([
        productService.getProducts(params),
        productService.getCategories(),
        productService.getBrands(),
      ]);

      // productsData.data chứa pagination object, productsData.data.data chứa mảng products
      setProducts(productsData.data?.data || []);
      setCategories(categoriesData.data || []);
      setBrands(brandsData.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (categoryId) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleBrandFilter = (brandId) => {
    const params = new URLSearchParams(searchParams);
    if (brandId) {
      params.set('brand', brandId);
    } else {
      params.delete('brand');
    }
    setSearchParams(params);
  };

  const handleStockFilter = (stockStatus) => {
    const params = new URLSearchParams(searchParams);
    if (stockStatus) {
      params.set('stock', stockStatus);
    } else {
      params.delete('stock');
    }
    setSearchParams(params);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    setSearchParams(params);
  };

  const handleMovementFilter = (movement) => {
    const params = new URLSearchParams(searchParams);
    if (movement) {
      params.set('movement', movement);
    } else {
      params.delete('movement');
    }
    setSearchParams(params);
  };

  const handleGenderFilter = (gender) => {
    const params = new URLSearchParams(searchParams);
    if (gender) {
      params.set('gender', gender);
    } else {
      params.delete('gender');
    }
    setSearchParams(params);
  };

  const handlePriceFilter = (range) => {
    const params = new URLSearchParams(searchParams);
    if (range) {
      params.set('price_range', range);
    } else {
      params.delete('price_range');
    }
    setSearchParams(params);
  };

  const handleWishlistToggle = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const inWishlist = isInWishlist(product.id);
      if (inWishlist) {
        const wishlistItem = wishlist?.wishlist?.items.find(
          item => item.product_id === product.id
        );
        if (wishlistItem) {
          await removeWishlistItem(wishlistItem.id);
        }
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="product-list-page">
      <div className="container">
        <h1>Sản Phẩm</h1>

        {/* Search Bar */}
        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên..."
              value={searchQuery || ''}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="clear-search-btn">
                ✕
              </button>
            )}
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="products-layout">
          {/* Sidebar Filters */}
          <aside className="filters-sidebar">
            <div className="filter-section">
              <h3>Danh Mục</h3>
              <ul className="filter-list">
                <li>
                  <button
                    className={!selectedCategory ? 'active' : ''}
                    onClick={() => handleCategoryFilter(null)}
                  >
                    Tất cả
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      className={selectedCategory == category.id ? 'active' : ''}
                      onClick={() => handleCategoryFilter(category.id)}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-section">
              <h3>Thương Hiệu</h3>
              <ul className="filter-list">
                <li>
                  <button
                    className={!selectedBrand ? 'active' : ''}
                    onClick={() => handleBrandFilter(null)}
                  >
                    Tất cả
                  </button>
                </li>
                {brands.map((brand) => (
                  <li key={brand.id}>
                    <button
                      className={selectedBrand == brand.id ? 'active' : ''}
                      onClick={() => handleBrandFilter(brand.id)}
                    >
                      {brand.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-section">
              <h3>Tình Trạng</h3>
              <ul className="filter-list">
                <li>
                  <button
                    className={!stockFilter ? 'active' : ''}
                    onClick={() => handleStockFilter(null)}
                  >
                    Tất cả
                  </button>
                </li>
                <li>
                  <button
                    className={stockFilter === 'in_stock' ? 'active' : ''}
                    onClick={() => handleStockFilter('in_stock')}
                  >
                    Còn hàng
                  </button>
                </li>
              </ul>
            </div>

            <div className="filter-section">
              <h3>Loại Bộ Máy</h3>
              <ul className="filter-list">
                <li>
                  <button
                    className={!movementFilter ? 'active' : ''}
                    onClick={() => handleMovementFilter(null)}
                  >
                    Tất cả
                  </button>
                </li>
                {['Quartz', 'Automatic', 'Manual', 'Solar'].map((type) => (
                  <li key={type}>
                    <button
                      className={movementFilter === type ? 'active' : ''}
                      onClick={() => handleMovementFilter(type)}
                    >
                      {type}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-section">
              <h3>Giới Tính</h3>
              <ul className="filter-list">
                <li>
                  <button
                    className={!genderFilter ? 'active' : ''}
                    onClick={() => handleGenderFilter(null)}
                  >
                    Tất cả
                  </button>
                </li>
                {['Nam', 'Nữ', 'Unisex'].map((gender) => (
                  <li key={gender}>
                    <button
                      className={genderFilter === gender ? 'active' : ''}
                      onClick={() => handleGenderFilter(gender)}
                    >
                      {gender}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-section">
              <h3>Khoảng Giá</h3>
              <ul className="filter-list">
                <li>
                  <button
                    className={!priceRange ? 'active' : ''}
                    onClick={() => handlePriceFilter(null)}
                  >
                    Tất cả
                  </button>
                </li>
                <li>
                  <button
                    className={priceRange === '0-5000000' ? 'active' : ''}
                    onClick={() => handlePriceFilter('0-5000000')}
                  >
                    Dưới 5 triệu
                  </button>
                </li>
                <li>
                  <button
                    className={priceRange === '5000000-10000000' ? 'active' : ''}
                    onClick={() => handlePriceFilter('5000000-10000000')}
                  >
                    5 - 10 triệu
                  </button>
                </li>
                <li>
                  <button
                    className={priceRange === '10000000-20000000' ? 'active' : ''}
                    onClick={() => handlePriceFilter('10000000-20000000')}
                  >
                    10 - 20 triệu
                  </button>
                </li>
                <li>
                  <button
                    className={priceRange === '20000000-up' ? 'active' : ''}
                    onClick={() => handlePriceFilter('20000000-up')}
                  >
                    Trên 20 triệu
                  </button>
                </li>
              </ul>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="products-content">
            {loading ? (
              <div className="loading">Đang tải sản phẩm...</div>
            ) : products.length === 0 ? (
              <div className="no-products">Không tìm thấy sản phẩm nào</div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <Link to={`/products/${product.id}`}>
                      <div className="product-image">
                        <button
                          className={`wishlist-heart ${isInWishlist(product.id) ? 'active' : ''}`}
                          onClick={(e) => handleWishlistToggle(e, product)}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
