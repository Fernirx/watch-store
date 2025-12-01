import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import brandService from '../../services/brandService';
import { formatPriceInput, parsePrice } from '../../utils/formatPrice';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    stock_quantity: '',
    category_id: '',
    brand_id: '',
    is_active: true,
    image: null,
  });

  useEffect(() => {
    fetchCategoriesAndBrands();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

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

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProduct(id);
      const product = response.data;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        sale_price: product.sale_price || '',
        stock_quantity: product.stock_quantity || '',
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        is_active: product.is_active ?? true,
        image: null,
      });

      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('price', formData.price);
      submitData.append('stock_quantity', formData.stock_quantity);
      submitData.append('category_id', formData.category_id);
      submitData.append('brand_id', formData.brand_id);
      submitData.append('is_active', formData.is_active ? '1' : '0');

      if (formData.sale_price) {
        submitData.append('sale_price', formData.sale_price);
      }

      if (formData.image) {
        submitData.append('image', formData.image);
      }

      // Debug logging
      console.log('Submitting product:', {
        name: formData.name,
        price: formData.price,
        sale_price: formData.sale_price,
        category_id: formData.category_id,
        brand_id: formData.brand_id,
        stock_quantity: formData.stock_quantity,
        is_active: formData.is_active,
        has_image: !!formData.image,
      });

      if (isEdit) {
        submitData.append('_method', 'PUT');
        await productService.updateProduct(id, submitData);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await productService.createProduct(submitData);
        alert('Tạo sản phẩm thành công!');
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response?.data);
      alert(
        `Không thể ${isEdit ? 'cập nhật' : 'tạo'} sản phẩm: ${
          error.response?.data?.message || error.message
        }\n\nChi tiết: ${JSON.stringify(error.response?.data?.errors || {})}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="admin-form-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? '✏️ Sửa Sản Phẩm' : '➕ Thêm Sản Phẩm Mới'}</h1>
          <div className="admin-breadcrumb">
            <a href="/admin">Dashboard</a>
            <span>/</span>
            <a href="/admin/products">Sản phẩm</a>
            <span>/</span>
            <span>{isEdit ? 'Sửa' : 'Thêm mới'}</span>
          </div>
        </div>
        <button onClick={() => navigate('/admin/products')} className="btn btn-secondary">
          ← Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label htmlFor="name" className="required">Tên sản phẩm</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-control"
            placeholder="Nhập tên sản phẩm..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="category_id" className="required">Danh mục</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="brand_id" className="required">Thương hiệu</label>
            <select
              id="brand_id"
              name="brand_id"
              value={formData.brand_id}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="">Chọn thương hiệu</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Mô tả sản phẩm</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="form-control"
            placeholder="Nhập mô tả chi tiết về sản phẩm..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="price" className="required">Giá gốc (₫)</label>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price ? formatPriceInput(formData.price.toString()) : ''}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, price: numericValue }));
              }}
              required
              className="form-control"
              placeholder="Ví dụ: 41.240.000"
            />
            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {formData.price ? `= ${formatPriceInput(formData.price.toString())} ₫` : 'Nhập giá bằng số (VD: 41240000 hoặc 41.240.000)'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="sale_price">Giá khuyến mãi (₫)</label>
            <input
              type="text"
              id="sale_price"
              name="sale_price"
              value={formData.sale_price ? formatPriceInput(formData.sale_price.toString()) : ''}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, sale_price: numericValue }));
              }}
              className="form-control"
              placeholder="Ví dụ: 35.000.000"
            />
            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {formData.sale_price ? `= ${formatPriceInput(formData.sale_price.toString())} ₫` : 'Để trống nếu không có khuyến mãi'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="stock_quantity" className="required">Số lượng tồn kho</label>
            <input
              type="number"
              id="stock_quantity"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              required
              min="0"
              className="form-control"
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Hình ảnh sản phẩm</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
            className="form-control"
          />
          {imagePreview && (
            <div style={{ marginTop: '1rem' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  border: '2px solid #e2e8f0'
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: '500' }}>Kích hoạt sản phẩm (hiển thị trên trang web)</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="btn btn-secondary"
          >
            ✕ Hủy
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? '⏳ Đang xử lý...' : isEdit ? '💾 Cập nhật' : '✓ Tạo mới'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
