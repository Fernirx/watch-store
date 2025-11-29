import axios from '../api/axiosConfig';

const productService = {
  // ========== PUBLIC ENDPOINTS ==========

  // Lấy danh sách sản phẩm với filters
  getProducts: async (params = {}) => {
    // params có thể bao gồm: category_id, brand_id, min_price, max_price,
    // gender, is_featured, search, sort_by, sort_order, per_page, page
    const response = await axios.get('/products', { params });
    return response.data;
  },

  // Lấy chi tiết sản phẩm
  getProduct: async (id) => {
    const response = await axios.get(`/products/${id}`);
    return response.data;
  },

  // Lấy danh mục
  getCategories: async () => {
    const response = await axios.get('/categories');
    return response.data;
  },

  // Lấy chi tiết danh mục
  getCategory: async (id) => {
    const response = await axios.get(`/categories/${id}`);
    return response.data;
  },

  // Lấy thương hiệu
  getBrands: async () => {
    const response = await axios.get('/brands');
    return response.data;
  },

  // Lấy chi tiết thương hiệu
  getBrand: async (id) => {
    const response = await axios.get(`/brands/${id}`);
    return response.data;
  },

  // ========== ADMIN ENDPOINTS (Require auth + admin role) ==========

  // Tạo sản phẩm mới
  createProduct: async (productData) => {
    // productData có thể là FormData nếu có upload ảnh
    const response = await axios.post('/products', productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật sản phẩm
  updateProduct: async (id, productData) => {
    // productData có thể là FormData nếu có upload ảnh
    // Laravel không hỗ trợ PUT với multipart/form-data
    // Sử dụng POST với _method=PUT
    const response = await axios.post(`/products/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa sản phẩm
  deleteProduct: async (id) => {
    const response = await axios.delete(`/products/${id}`);
    return response.data;
  },

  // Tạo danh mục mới
  createCategory: async (categoryData) => {
    // categoryData có thể là FormData nếu có upload ảnh
    const response = await axios.post('/categories', categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật danh mục
  updateCategory: async (id, categoryData) => {
    const response = await axios.post(`/categories/${id}`, categoryData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa danh mục
  deleteCategory: async (id) => {
    const response = await axios.delete(`/categories/${id}`);
    return response.data;
  },

  // Tạo thương hiệu mới
  createBrand: async (brandData) => {
    // brandData có thể là FormData nếu có upload logo
    const response = await axios.post('/brands', brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật thương hiệu
  updateBrand: async (id, brandData) => {
    const response = await axios.post(`/brands/${id}`, brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Xóa thương hiệu
  deleteBrand: async (id) => {
    const response = await axios.delete(`/brands/${id}`);
    return response.data;
  },
};

export default productService;
