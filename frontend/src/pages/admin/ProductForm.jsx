import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import brandService from '../../services/brandService';
import { formatPriceInput, parsePrice } from '../../utils/formatPrice';
import './ProductForm.css';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Information
    code: '',
    name: '',
    description: '',

    // Pricing
    price: '',
    original_price: '',
    cost_price: '',

    // Inventory
    stock_quantity: '',
    min_stock_level: '10',
    reorder_point: '5',

    // Product Details
    warranty_period: '',
    origin_country: '',
    gender: '',

    // Movement
    movement_type: '',
    movement_name: '',
    power_reserve: '',

    // Materials
    case_material: '',
    strap_material: '',
    glass_material: '',

    // Colors
    dial_color: '',
    case_color: '',
    strap_color: '',

    // Water Resistance & Battery
    water_resistance: '',
    battery_type: '',
    battery_voltage: '',

    // Technical Specs
    case_size: '',
    case_thickness: '',
    weight: '',

    // Features (comma-separated)
    features: '',

    // Relations
    category_id: '',
    brand_id: '',

    // Status
    is_new: false,
    is_on_sale: false,
    is_featured: false,
    is_active: true,

    // Image
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
        code: product.code || '',
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        original_price: product.original_price || '',
        cost_price: product.cost_price || '',
        stock_quantity: product.stock_quantity || '',
        min_stock_level: product.min_stock_level || '10',
        reorder_point: product.reorder_point || '5',
        warranty_period: product.warranty_period || '',
        origin_country: product.origin_country || '',
        gender: product.gender || '',
        movement_type: product.movement_type || '',
        movement_name: product.movement_name || '',
        power_reserve: product.power_reserve || '',
        case_material: product.case_material || '',
        strap_material: product.strap_material || '',
        glass_material: product.glass_material || '',
        dial_color: product.dial_color || '',
        case_color: product.case_color || '',
        strap_color: product.strap_color || '',
        water_resistance: product.water_resistance || '',
        battery_type: product.battery_type || '',
        battery_voltage: product.battery_voltage || '',
        case_size: product.case_size || '',
        case_thickness: product.case_thickness || '',
        weight: product.weight || '',
        features: Array.isArray(product.features) ? product.features.join(', ') : '',
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        is_new: product.is_new ?? false,
        is_on_sale: product.is_on_sale ?? false,
        is_featured: product.is_featured ?? false,
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

  const validateForm = () => {
    const errors = [];

    // Validate tên sản phẩm
    if (!formData.name.trim()) {
      errors.push('Tên sản phẩm là bắt buộc');
    } else if (formData.name.trim().length < 3) {
      errors.push('Tên sản phẩm phải có ít nhất 3 ký tự');
    }

    // Validate giá
    if (!formData.price || formData.price <= 0) {
      errors.push('Giá gốc phải lớn hơn 0');
    }

    // Validate giá khuyến mãi
    if (formData.sale_price) {
      const salePrice = parseFloat(formData.sale_price);
      const price = parseFloat(formData.price);

      if (salePrice <= 0) {
        errors.push('Giá khuyến mãi phải lớn hơn 0');
      } else if (salePrice >= price) {
        errors.push('Giá khuyến mãi phải nhỏ hơn giá gốc');
      }
    }

    // Validate số lượng tồn kho
    if (!formData.stock_quantity || formData.stock_quantity < 0) {
      errors.push('Số lượng tồn kho phải >= 0');
    }

    // Validate danh mục
    if (!formData.category_id) {
      errors.push('Vui lòng chọn danh mục');
    }

    // Validate thương hiệu
    if (!formData.brand_id) {
      errors.push('Vui lòng chọn thương hiệu');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form trước khi submit
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert('Lỗi validation:\n' + validationErrors.join('\n'));
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();

      // Basic Information
      if (formData.code) submitData.append('code', formData.code);
      submitData.append('name', formData.name);
      if (formData.description) submitData.append('description', formData.description);

      // Pricing
      submitData.append('price', formData.price);
      if (formData.original_price) submitData.append('original_price', formData.original_price);
      if (formData.cost_price) submitData.append('cost_price', formData.cost_price);

      // Inventory
      submitData.append('stock_quantity', formData.stock_quantity);
      if (formData.min_stock_level) submitData.append('min_stock_level', formData.min_stock_level);
      if (formData.reorder_point) submitData.append('reorder_point', formData.reorder_point);

      // Product Details
      if (formData.warranty_period) submitData.append('warranty_period', formData.warranty_period);
      if (formData.origin_country) submitData.append('origin_country', formData.origin_country);
      if (formData.gender) submitData.append('gender', formData.gender);

      // Movement
      if (formData.movement_type) submitData.append('movement_type', formData.movement_type);
      if (formData.movement_name) submitData.append('movement_name', formData.movement_name);
      if (formData.power_reserve) submitData.append('power_reserve', formData.power_reserve);

      // Materials
      if (formData.case_material) submitData.append('case_material', formData.case_material);
      if (formData.strap_material) submitData.append('strap_material', formData.strap_material);
      if (formData.glass_material) submitData.append('glass_material', formData.glass_material);

      // Colors
      if (formData.dial_color) submitData.append('dial_color', formData.dial_color);
      if (formData.case_color) submitData.append('case_color', formData.case_color);
      if (formData.strap_color) submitData.append('strap_color', formData.strap_color);

      // Water Resistance & Battery
      if (formData.water_resistance) submitData.append('water_resistance', formData.water_resistance);
      if (formData.battery_type) submitData.append('battery_type', formData.battery_type);
      if (formData.battery_voltage) submitData.append('battery_voltage', formData.battery_voltage);

      // Technical Specs
      if (formData.case_size) submitData.append('case_size', formData.case_size);
      if (formData.case_thickness) submitData.append('case_thickness', formData.case_thickness);
      if (formData.weight) submitData.append('weight', formData.weight);

      // Features (convert comma-separated string to array)
      if (formData.features && formData.features.trim()) {
        const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f);
        submitData.append('features', JSON.stringify(featuresArray));
      } else {
        submitData.append('features', JSON.stringify([]));
      }

      // Relations
      submitData.append('category_id', formData.category_id);
      submitData.append('brand_id', formData.brand_id);

      // Status & Badges
      submitData.append('is_new', formData.is_new ? '1' : '0');
      submitData.append('is_on_sale', formData.is_on_sale ? '1' : '0');
      submitData.append('is_featured', formData.is_featured ? '1' : '0');
      submitData.append('is_active', formData.is_active ? '1' : '0');

      // Image
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
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="form-section">
          <h2 className="form-section-title">📝 Thông Tin Cơ Bản</h2>

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
              placeholder="VD: Rolex Submariner Date"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="code">Mã sản phẩm</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: ROLEX-SUB-001"
              />
              <small>Để trống để tự động tạo</small>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
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
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="gender">Giới tính</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Unisex">Unisex</option>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="warranty_period">Bảo hành</label>
              <input
                type="text"
                id="warranty_period"
                name="warranty_period"
                value={formData.warranty_period}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: 24 tháng"
              />
            </div>

            <div className="form-group">
              <label htmlFor="origin_country">Xuất xứ</label>
              <input
                type="text"
                id="origin_country"
                name="origin_country"
                value={formData.origin_country}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Thụy Sỹ"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: GIÁ VÀ KHO */}
        <div className="form-section">
          <h2 className="form-section-title">💰 Giá & Quản Lý Kho</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="price" className="required">Giá bán (₫)</label>
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
                placeholder="VD: 15.000.000"
              />
              <small>{formData.price ? formatPriceInput(formData.price.toString()) + ' ₫' : 'Giá hiện tại'}</small>
            </div>

            <div className="form-group">
              <label htmlFor="original_price">Giá gốc (₫)</label>
              <input
                type="text"
                id="original_price"
                name="original_price"
                value={formData.original_price ? formatPriceInput(formData.original_price.toString()) : ''}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, original_price: numericValue }));
                }}
                className="form-control"
                placeholder="VD: 17.000.000"
              />
              <small>{formData.original_price ? formatPriceInput(formData.original_price.toString()) + ' ₫' : 'Giá trước giảm'}</small>
            </div>

            <div className="form-group">
              <label htmlFor="cost_price">Giá vốn (₫)</label>
              <input
                type="text"
                id="cost_price"
                name="cost_price"
                value={formData.cost_price ? formatPriceInput(formData.cost_price.toString()) : ''}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, cost_price: numericValue }));
                }}
                className="form-control"
                placeholder="VD: 12.000.000"
              />
              <small>{formData.cost_price ? formatPriceInput(formData.cost_price.toString()) + ' ₫' : 'Giá nhập'}</small>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="stock_quantity" className="required">Tồn kho</label>
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

            <div className="form-group">
              <label htmlFor="min_stock_level">Tồn tối thiểu</label>
              <input
                type="number"
                id="min_stock_level"
                name="min_stock_level"
                value={formData.min_stock_level}
                onChange={handleChange}
                min="0"
                className="form-control"
                placeholder="10"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reorder_point">Điểm đặt lại</label>
              <input
                type="number"
                id="reorder_point"
                name="reorder_point"
                value={formData.reorder_point}
                onChange={handleChange}
                min="0"
                className="form-control"
                placeholder="5"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BỘ MÁY */}
        <div className="form-section">
          <h2 className="form-section-title">⚙️ Bộ Máy</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="movement_type">Loại bộ máy</label>
              <select
                id="movement_type"
                name="movement_type"
                value={formData.movement_type}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Chọn loại</option>
                <option value="Quartz">Quartz</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="Solar">Solar</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="movement_name">Tên bộ máy</label>
              <input
                type="text"
                id="movement_name"
                name="movement_name"
                value={formData.movement_name}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Calibre 3235"
              />
            </div>

            <div className="form-group">
              <label htmlFor="power_reserve">Trữ cót</label>
              <input
                type="text"
                id="power_reserve"
                name="power_reserve"
                value={formData.power_reserve}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: 70 giờ"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="battery_type">Loại pin</label>
              <input
                type="text"
                id="battery_type"
                name="battery_type"
                value={formData.battery_type}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: SR927W"
              />
              <small>Chỉ áp dụng cho đồng hồ Quartz</small>
            </div>

            <div className="form-group">
              <label htmlFor="battery_voltage">Điện áp pin</label>
              <input
                type="text"
                id="battery_voltage"
                name="battery_voltage"
                value={formData.battery_voltage}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: 3V"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: CHẤT LIỆU & MÀU SẮC */}
        <div className="form-section">
          <h2 className="form-section-title">🎨 Chất Liệu & Màu Sắc</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="case_material">Chất liệu vỏ</label>
              <input
                type="text"
                id="case_material"
                name="case_material"
                value={formData.case_material}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Thép không gỉ 904L"
              />
            </div>

            <div className="form-group">
              <label htmlFor="strap_material">Chất liệu dây</label>
              <input
                type="text"
                id="strap_material"
                name="strap_material"
                value={formData.strap_material}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Da thật"
              />
            </div>

            <div className="form-group">
              <label htmlFor="glass_material">Chất liệu kính</label>
              <input
                type="text"
                id="glass_material"
                name="glass_material"
                value={formData.glass_material}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Sapphire chống trầy"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="dial_color">Màu mặt số</label>
              <input
                type="text"
                id="dial_color"
                name="dial_color"
                value={formData.dial_color}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Đen"
              />
            </div>

            <div className="form-group">
              <label htmlFor="case_color">Màu vỏ</label>
              <input
                type="text"
                id="case_color"
                name="case_color"
                value={formData.case_color}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Bạc"
              />
            </div>

            <div className="form-group">
              <label htmlFor="strap_color">Màu dây</label>
              <input
                type="text"
                id="strap_color"
                name="strap_color"
                value={formData.strap_color}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: Nâu"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: THÔNG SỐ KỸ THUẬT */}
        <div className="form-section">
          <h2 className="form-section-title">📏 Thông Số Kỹ Thuật</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="case_size">Đường kính (mm)</label>
              <input
                type="number"
                step="0.01"
                id="case_size"
                name="case_size"
                value={formData.case_size}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: 41"
              />
            </div>

            <div className="form-group">
              <label htmlFor="case_thickness">Độ dày (mm)</label>
              <input
                type="number"
                step="0.01"
                id="case_thickness"
                name="case_thickness"
                value={formData.case_thickness}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: 12.5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Trọng lượng (g)</label>
              <input
                type="number"
                step="0.01"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: 155"
              />
            </div>

            <div className="form-group">
              <label htmlFor="water_resistance">Chống nước</label>
              <input
                type="text"
                id="water_resistance"
                name="water_resistance"
                value={formData.water_resistance}
                onChange={handleChange}
                className="form-control"
                placeholder="VD: 300m (30 ATM)"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="features">Tính năng đặc biệt</label>
            <input
              type="text"
              id="features"
              name="features"
              value={formData.features}
              onChange={handleChange}
              className="form-control"
              placeholder="VD: Date Display, Chronograph, GMT (ngăn cách bằng dấu phẩy)"
            />
            <small>Nhập các tính năng cách nhau bởi dấu phẩy</small>
          </div>
        </div>

        {/* SECTION 6: HÌNH ẢNH & TRẠNG THÁI */}
        <div className="form-section">
          <h2 className="form-section-title">🖼️ Hình Ảnh & Trạng Thái</h2>

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Hiển thị sản phẩm</span>
              </label>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_new"
                  checked={formData.is_new}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Sản phẩm mới (badge NEW)</span>
              </label>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_on_sale"
                  checked={formData.is_on_sale}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Đang giảm giá (badge SALE)</span>
              </label>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Sản phẩm nổi bật</span>
              </label>
            </div>
          </div>
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
