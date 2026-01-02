import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import brandService from '../../services/brandService';
import Toast from '../../components/Toast';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    category_id: '',
    brand_id: '',
    movement_type: '',
    gender: '',
    stock_status: '', // all, in_stock, out_of_stock, low_stock
    is_active: '', // all, true, false
    is_new: '',
    is_on_sale: '',
    is_featured: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, filters]);

  const fetchCategoriesAndBrands = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        categoryService.getCategories(),
        brandService.getBrands(),
      ]);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error fetching categories/brands:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 20,
        search: search || undefined,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };

      // Add filters
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.brand_id) params.brand_id = filters.brand_id;
      if (filters.movement_type) params.movement_type = filters.movement_type;
      if (filters.gender) params.gender = filters.gender;

      // Stock status filters
      if (filters.stock_status === 'in_stock') params.in_stock = true;
      if (filters.stock_status === 'out_of_stock') params.max_stock = 0;
      if (filters.stock_status === 'low_stock') params.low_stock = true;

      // Active status (admin can see all)
      if (filters.is_active === 'true') params.is_active = true;
      if (filters.is_active === 'false') params.is_active = false;

      // Badge filters
      if (filters.is_new === 'true') params.is_new = true;
      if (filters.is_on_sale === 'true') params.is_on_sale = true;
      if (filters.is_featured === 'true') params.is_featured = true;

      const response = await productService.getAdminProducts(params);

      setProducts(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      return;
    }

    try {
      await productService.deleteProduct(id);
      fetchProducts();
      setToast({ message: 'Xóa sản phẩm thành công!', type: 'success' });
    } catch (error) {
      console.error('Error deleting product:', error);
      setToast({ message: 'Không thể xóa sản phẩm', type: 'error' });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      category_id: '',
      brand_id: '',
      movement_type: '',
      gender: '',
      stock_status: '',
      is_active: '',
      is_new: '',
      is_on_sale: '',
      is_featured: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    setSearch('');
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sort_by' || key === 'sort_order') return false;
    return value !== '';
  }).length + (search ? 1 : 0);

  const isInitialLoading = loading && products.length === 0;

  if (isInitialLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>Quản Lý Sản Phẩm</h1>
          <div className="admin-breadcrumb">
            <Link to="/admin">Dashboard</Link>
            <span>/</span>
            <span>Sản phẩm</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="products-toolbar">
        <div className="toolbar-row">
          <form onSubmit={handleSearch} className="toolbar-search-form">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>
          <div className="toolbar-actions">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="btn btn-danger toolbar-btn"
              >
                ✕ Xóa bộ lọc
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary toolbar-btn"
            >
              <i className="fas fa-filter"></i> Bộ lọc
              {activeFiltersCount > 0 && (
                <span className="filter-count-badge">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <Link to="/admin/products/create" className="btn btn-addproduct toolbar-btn">
              <i className="fas fa-plus"></i> Thêm Sản Phẩm Mới
            </Link>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>🔍 Bộ Lọc Sản Phẩm</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Category Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Danh mục
                </label>
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Thương hiệu
                </label>
                <select
                  value={filters.brand_id}
                  onChange={(e) => handleFilterChange('brand_id', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              {/* Movement Type Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Loại bộ máy
                </label>
                <select
                  value={filters.movement_type}
                  onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  <option value="Quartz">Quartz</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                  <option value="Solar">Solar</option>
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Giới tính
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Trạng thái kho
                </label>
                <select
                  value={filters.stock_status}
                  onChange={(e) => handleFilterChange('stock_status', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  <option value="in_stock">Còn hàng</option>
                  <option value="low_stock">Sắp hết (≤ min)</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>
              </div>

              {/* Active Status Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Trạng thái hiển thị
                </label>
                <select
                  value={filters.is_active}
                  onChange={(e) => handleFilterChange('is_active', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Đang hiển thị</option>
                  <option value="false">Đang ẩn</option>
                </select>
              </div>

              {/* NEW Badge Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Badge NEW
                </label>
                <select
                  value={filters.is_new}
                  onChange={(e) => handleFilterChange('is_new', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Có badge NEW</option>
                </select>
              </div>

              {/* SALE Badge Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Badge SALE
                </label>
                <select
                  value={filters.is_on_sale}
                  onChange={(e) => handleFilterChange('is_on_sale', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Có badge SALE</option>
                </select>
              </div>

              {/* Featured Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Sản phẩm nổi bật
                </label>
                <select
                  value={filters.is_featured}
                  onChange={(e) => handleFilterChange('is_featured', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Nổi bật</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Sắp xếp theo
                </label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="created_at">Ngày tạo</option>
                  <option value="name">Tên A-Z</option>
                  <option value="price">Giá</option>
                  <option value="stock_quantity">Tồn kho</option>
                  <option value="sold_count">Đã bán</option>
                  <option value="view_count">Lượt xem</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Thứ tự
                </label>
                <select
                  value={filters.sort_order}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
              </div>
            </div>

            {/* Stats Summary */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '0.5rem',
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              fontSize: '0.875rem'
            }}>
              <span style={{ fontWeight: '600' }}>Kết quả:</span>
              <span style={{ color: '#059669' }}>📦 {products.length} sản phẩm</span>
              <span style={{ color: '#64748b' }}>Trang {currentPage}/{totalPages}</span>
            </div>
          </div>
        )}
      </div>

      <div className="admin-table-container" style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '0.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: '#64748b' }}>Đang tải...</p>
            </div>
          </div>
        )}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã/ID</th>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Bộ máy</th>
              <th>Giá bán</th>
              <th>Tồn kho</th>
              <th>Badges</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h3>Chưa có sản phẩm nào</h3>
                    <p>Hãy thêm sản phẩm đầu tiên của bạn</p>
                    <Link to="/admin/products/create" className="btn btn-primary">
                      <i className="fas fa-plus"></i> Thêm Sản Phẩm
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  {/* Mã & ID */}
                  <td>
                    <div style={{ fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: '600', color: '#334155' }}>
                        {product.code || `#${product.id}`}
                      </div>
                      <div style={{ color: '#94a3b8' }}>ID: {product.id}</div>
                    </div>
                  </td>

                  {/* Hình ảnh */}
                  <td>
                    {product.image_url || product.primary_image ? (
                      <img
                        src={product.primary_image || product.image_url}
                        alt={product.name}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '0.5rem',
                          border: '2px solid #e2e8f0'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#f1f5f9',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>
                      </div>
                    )}
                  </td>

                  {/* Tên & Brand */}
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {product.brand?.name || '-'}
                      </div>
                    </div>
                  </td>

                  {/* Danh mục */}
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: 'none',
                      color: '#4f46e5',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {product.category?.name || '-'}
                    </span>
                  </td>

                  {/* Bộ máy */}
                  <td>
                    {product.movement_type ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'none',
                        color: '#1e40af',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {product.movement_type}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>-</span>
                    )}
                  </td>

                  {/* Giá */}
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: '700', color: '#059669' }}>
                        {parseFloat(product.price).toLocaleString('vi-VN')}₫
                      </div>
                      {product.original_price && product.original_price > product.price && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          textDecoration: 'line-through'
                        }}>
                          {parseFloat(product.original_price).toLocaleString('vi-VN')}₫
                        </div>
                      )}
                      {product.discount_percentage > 0 && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#dc2626',
                          fontWeight: '600'
                        }}>
                          -{product.discount_percentage}%
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Tồn kho */}
                  <td>
                    <div>
                      <span
                        className={
                          product.stock_quantity === 0
                            ? 'badge badge-danger'
                            : product.stock_quantity <= (product.min_stock_level || 10)
                              ? 'badge badge-warning'
                              : 'badge badge-success'
                        }
                        style={{ fontWeight: '700', fontSize: '0.875rem' }}
                      >
                        {product.stock_quantity}
                      </span>
                      {product.stock_quantity <= (product.min_stock_level || 10) && product.stock_quantity > 0 && (
                        <div style={{ fontSize: '0.625rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                          <i className="fas fa-exclamation-triangle"></i> Sắp hết
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Badges */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {product.is_new && (
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          background: 'none',
                          color: '#059669',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: '700',
                          textAlign: 'center'
                        }}>
                          NEW
                        </span>
                      )}
                      {product.is_on_sale && (
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          background: 'none',
                          color: '#dc2626',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: '700',
                          textAlign: 'center'
                        }}>
                          SALE
                        </span>
                      )}
                      {product.is_featured && (
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          background: 'none',
                          color: '#b45309',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: '700',
                          textAlign: 'center'
                        }}>
                          HOT
                        </span>
                      )}
                      {!product.is_new && !product.is_on_sale && !product.is_featured && (
                        <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>-</span>
                      )}
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td>
                    <div>
                      <span
                        className={
                          product.is_active
                            ? 'badge badge-success'
                            : 'badge badge-secondary'
                        }
                        style={{ fontSize: '0.75rem', fontWeight: '700' }}
                      >
                        {product.is_active ? '✓ Hiện' : '✕ Ẩn'}
                      </span>
                      {product.view_count > 0 && (
                        <div style={{ fontSize: '0.625rem', color: '#64748b', marginTop: '0.25rem' }}>
                          <i className="fas fa-eye"></i> {product.view_count} lượt xem
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Hành động */}
                  <td>
                    <div className="table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="btn-icon edit"
                        aria-label="Chỉnh sửa sản phẩm"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="btn-icon delete"
                        aria-label="Xóa sản phẩm"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            Trước
          </button>
          <span className="page-info">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            Sau
          </button>
        </div>
      )}

      {/* Toast Notification */}
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

export default Products;
