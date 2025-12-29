import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import productService from '../../services/productService';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
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

  // Price range state for slider
  const MIN_PRICE = 0;
  const MAX_PRICE = 50000000; // 50 triệu VND
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('min_price')) || MIN_PRICE,
    parseInt(searchParams.get('max_price')) || MAX_PRICE
  ]);

  const selectedCategory = searchParams.get('category');
  const selectedBrand = searchParams.get('brand');
  const searchQuery = searchParams.get('search');
  const stockFilter = searchParams.get('stock');
  const movementFilter = searchParams.get('movement');
  const genderFilter = searchParams.get('gender');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');

  // Sync priceRange state with URL params
  useEffect(() => {
    setPriceRange([
      parseInt(minPrice) || MIN_PRICE,
      parseInt(maxPrice) || MAX_PRICE
    ]);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedBrand, searchQuery, stockFilter, movementFilter, genderFilter, minPrice, maxPrice]);

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
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;

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

  const handlePriceRangeChange = (values) => {
    setPriceRange(values);
  };

  const handlePriceRangeAfterChange = (values) => {
    const params = new URLSearchParams(searchParams);
    const [min, max] = values;

    // Only set params if not at default values
    if (min > MIN_PRICE) {
      params.set('min_price', min);
    } else {
      params.delete('min_price');
    }

    if (max < MAX_PRICE) {
      params.set('max_price', max);
    } else {
      params.delete('max_price');
    }

    setSearchParams(params);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
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
          <SearchBar
            value={searchQuery || ''}
            onChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v.trim()) {
                params.set('search', v);
              } else {
                params.delete('search');
              }
              setSearchParams(params);
            }}
            onClear={clearSearch}
            placeholder="Tìm kiếm sản phẩm theo tên..."
          />
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
              <div className="price-range-container">
                <div className="price-range-labels">
                  <span className="price-label">{formatPrice(priceRange[0])}</span>
                  <span className="price-label">{formatPrice(priceRange[1])}</span>
                </div>
                <Slider
                  range
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={500000}
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                  onChangeComplete={handlePriceRangeAfterChange}
                  className="price-range-slider"
                />
                <div className="price-range-min-max">
                  <span>{formatPrice(MIN_PRICE)}</span>
                  <span>{formatPrice(MAX_PRICE)}</span>
                </div>
              </div>
            </div>
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setSearchParams({});
                  setPriceRange([MIN_PRICE, MAX_PRICE]);
                }}
              >
                Reset Bộ Lọc
              </button>
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
