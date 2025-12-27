import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import GoogleCallback from './pages/auth/GoogleCallback';

// Product Pages
import HomePage from './pages/products/HomePage';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';

// Cart & Checkout
import Cart from './pages/cart/Cart';
import Checkout from './pages/cart/Checkout';

// Wishlist
import Wishlist from './pages/wishlist/Wishlist';

// Orders
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';

// Profile
import Profile from './pages/profile/Profile';

// Payment Pages
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailed from './pages/payment/PaymentFailed';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/Categories';
import AdminBrands from './pages/admin/Brands';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminCoupons from './pages/admin/Coupons';
import AdminUsers from './pages/admin/Users';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />

            {/* Payment Result Pages */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />

            {/* Main Layout Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />

              {/* Public Routes - Guest can access */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* Protected Routes */}
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrderList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Admin Routes */}
            <Route
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/create" element={<AdminProductForm />} />
              <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/brands" element={<AdminBrands />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
