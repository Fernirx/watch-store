import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [products, categories, brands, orders] = await Promise.all([
        axios.get('/products?per_page=1'),
        axios.get('/categories'),
        axios.get('/brands'),
        axios.get('/orders'),
      ]);

      setStats({
        totalProducts: products.data.data.total || 0,
        totalCategories: categories.data.data?.length || 0,
        totalBrands: brands.data.data?.length || 0,
        totalOrders: orders.data.data?.length || 0,
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
          <h1>📊 Dashboard</h1>
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
              📦
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
              🏷️
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
              ⭐
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
              🛒
            </div>
          </div>
          <div className="stat-card-footer">
            <Link to="/admin/orders" style={{ color: '#ef4444', textDecoration: 'none' }}>
              Xem đơn hàng →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>
          ⚡ Thao tác nhanh
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link to="/admin/products/create" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
            ➕ Thêm sản phẩm
          </Link>
          <Link to="/admin/categories" className="btn btn-success btn-lg" style={{ justifyContent: 'center' }}>
            ➕ Thêm danh mục
          </Link>
          <Link to="/admin/brands" className="btn btn-secondary btn-lg" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            ➕ Thêm thương hiệu
          </Link>
          <Link to="/admin/orders" className="btn btn-secondary btn-lg" style={{ justifyContent: 'center' }}>
            📋 Xem đơn hàng
          </Link>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{ marginTop: '2rem', background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>
          📈 Hoạt động gần đây
        </h2>
        <p style={{ color: '#64748b' }}>Chức năng này đang được phát triển...</p>
      </div>
    </div>
  );
};

export default Dashboard;
