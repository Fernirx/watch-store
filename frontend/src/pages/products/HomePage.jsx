import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToWishlist, removeWishlistItem, isInWishlist, wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
            <ProductCard
              key={product.id}
              product={product}
              isInWishlist={isInWishlist}
              onWishlistToggle={handleWishlistToggle}
            />
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
