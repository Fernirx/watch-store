import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard';
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

  const selectedCategoryData = selectedCategory 
    ? categories.find(cat => cat.id == selectedCategory)
    : null;

  return (
    <div className="product-list-page">
      <div className="container">
        
        {/* Category Banner */}
        {selectedCategoryData && (
          <div 
            className="category-banner"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(102, 126, 234, 0.75) 0%, rgba(118, 75, 162, 0.75) 100%), 
              url('https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="category-banner-content">
              <h2>{selectedCategoryData.name}</h2>
              <p>{selectedCategoryData.description}</p>
            </div>
          </div>
        )}

        {/* All Products Banner */}
        {!selectedCategoryData && (
          <div 
            className="category-banner all-products-banner"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(91, 97, 102, 0.65) 0%, rgba(83, 88, 93, 0.65) 100%)
              , url('https://imgs.search.brave.com/PJDXZdkjaftltc-nJigZ72VduNNwIBTWYOCZtwqPH_Y/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzE1LzU3LzY2Lzgw/LzM2MF9GXzE1NTc2/NjgwNDRfbEZ3ekdW/TXp4TU9TeXo0ZVF5/SG1KdHNuWDByOWVH/d2QuanBn')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="category-banner-content">
              <h2>Đồng Hồ Chính Hãng</h2>
              <p>Khám phá bộ sưu tập đồng hồ đa dạng từ các thương hiệu hàng đầu thế giới, với chất lượng tuyệt vời và thiết kế hiện đại</p>
            </div>
          </div>
        )}
        <div className="product-list-header">
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
              <span className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="products-layout">
          {/* Sidebar Filters */}
          <aside className="filters-sidebar">
            <div className="filter-section">
              <h3>Danh Mục</h3>
              <select
                className="filter-select"
                value={selectedCategory || ''}
                onChange={(e) => handleCategoryFilter(e.target.value || null)}
              >
                <option value="">Tất cả</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <h3>Thương Hiệu</h3>
              <select
                className="filter-select"
                value={selectedBrand || ''}
                onChange={(e) => handleBrandFilter(e.target.value || null)}
              >
                <option value="">Tất cả</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <h3>Tình Trạng</h3>
              <select
                className="filter-select"
                value={stockFilter || ''}
                onChange={(e) => handleStockFilter(e.target.value || null)}
              >
                <option value="">Tất cả</option>
                <option value="in_stock">Còn hàng</option>
              </select>
            </div>

            <div className="filter-section">
              <h3>Loại Bộ Máy</h3>
              <select
                className="filter-select"
                value={movementFilter || ''}
                onChange={(e) => handleMovementFilter(e.target.value || null)}
              >
                <option value="">Tất cả</option>
                <option value="Quartz">Quartz</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="Solar">Solar</option>
              </select>
            </div>

            <div className="filter-section">
              <h3>Giới Tính</h3>
              <select
                className="filter-select"
                value={genderFilter || ''}
                onChange={(e) => handleGenderFilter(e.target.value || null)}
              >
                <option value="">Tất cả</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div className="filter-section">
              <h3>Khoảng Giá</h3>
              <select
                className="filter-select"
                value={priceRange || ''}
                onChange={(e) => handlePriceFilter(e.target.value || null)}
              >
                <option value="">Tất cả</option>
                <option value="0-5000000">Dưới 5 triệu</option>
                <option value="5000000-10000000">5 - 10 triệu</option>
                <option value="10000000-20000000">10 - 20 triệu</option>
                <option value="20000000-up">Trên 20 triệu</option>
              </select>
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
                  <ProductCard
                    key={product.id}
                    product={product}
                    isInWishlist={isInWishlist}
                    onWishlistToggle={handleWishlistToggle}
                  />
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
