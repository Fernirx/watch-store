import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    totalOrders: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [products, categories, brands, orders, users] = await Promise.all([
        axios.get('/products?per_page=1'),
        axios.get('/categories'),
        axios.get('/brands'),
        axios.get('/orders'),
        axios.get('/users?per_page=1'),
      ]);

      setStats({
        totalProducts: products.data.data.total || 0,
        totalCategories: categories.data.data?.length || 0,
        totalBrands: brands.data.data?.length || 0,
        totalOrders: orders.data.data?.length || 0,
        totalUsers: users.data.data?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1> Dashboard</h1>
          <div className="admin-breadcrumb">
            <span>Tổng quan hệ thống</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-content">
              <h3>Sản phẩm</h3>
              <p>{stats.totalProducts}</p>
            </div>
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)' }}>
              <i style={{ width: '24px', height: '24px' }} className="fa fa-cube"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <Link to="/admin/products" style={{ color: '#667eea', textDecoration: 'none' }}>
              Xem tất cả →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-content">
              <h3>Danh mục</h3>
              <p>{stats.totalCategories}</p>
            </div>
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)' }}>
              <i style={{ width: '24px', height: '24px' }} className="fa fa-tags"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <Link to="/admin/categories" style={{ color: '#10b981', textDecoration: 'none' }}>
              Quản lý danh mục →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-content">
              <h3>Thương hiệu</h3>
              <p>{stats.totalBrands}</p>
            </div>
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)' }}>
              <i style={{ width: '24px', height: '24px' }} className="fa fa-star"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <Link to="/admin/brands" style={{ color: '#f59e0b', textDecoration: 'none' }}>
              Quản lý thương hiệu →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-content">
              <h3>Đơn hàng</h3>
              <p>{stats.totalOrders}</p>
            </div>
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)' }}>
              <i style={{ width: '24px', height: '24px' }} className="fa fa-shopping-cart"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <Link to="/admin/orders" style={{ color: '#ef4444', textDecoration: 'none' }}>
              Xem đơn hàng →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-content">
              <h3>Người dùng</h3>
              <p>{stats.totalUsers}</p>
            </div>
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)' }}>
              <i style={{ width: '24px', height: '24px' }} className="fa fa-users"></i>
            </div>
          </div>
          <div className="stat-card-footer">
            <Link to="/admin/users" style={{ color: '#8b5cf6', textDecoration: 'none' }}>
              Quản lý người dùng →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <h2>Thao tác nhanh</h2>
        <div className="admin-quick-actions-grid">
          <Link to="/admin/products/create" className="quick-action-btn quick-action-products">
            <i className="fa fa-plus"></i> Thêm sản phẩm
          </Link>
          <Link to="/admin/categories" className="quick-action-btn quick-action-categories">
            <i className="fa fa-plus"></i> Thêm danh mục
          </Link>
          <Link to="/admin/brands" className="quick-action-btn quick-action-brands">
            <i className="fa fa-plus"></i> Thêm thương hiệu
          </Link>
          <Link to="/admin/orders" className="quick-action-btn quick-action-orders">
            <i className="fa fa-list"></i> Xem đơn hàng
          </Link>
          <Link to="/admin/users" className="quick-action-btn quick-action-users">
            <i className="fa fa-user-plus"></i> Thêm người dùng
          </Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{ marginTop: '2rem', background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>
          <i className="fa fa-history" style={{ marginRight: '0.5rem' }}></i> Hoạt động gần đây
        </h2>
        <p style={{ color: '#64748b' }}>Chức năng này đang được phát triển...</p>
      </div>
    </div>
  );
};

export default Dashboard;
