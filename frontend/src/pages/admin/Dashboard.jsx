import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import RevenueChart from '../../components/charts/RevenueChart';
import OrderStatusChart from '../../components/charts/OrderStatusChart';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getStats();

      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const getGrowthClass = (growth) => {
    if (growth > 0) return 'growth-positive';
    if (growth < 0) return 'growth-negative';
    return 'growth-neutral';
  };

  const renderGrowthIndicator = (growth) => {
    if (growth === 0) return null;

    return (
      <span className={`growth-indicator ${getGrowthClass(growth)}`}>
        <i className={`fa fa-arrow-${growth > 0 ? 'up' : 'down'}`}></i>
        {Math.abs(growth)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Đang tải dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchDashboardStats} className="retry-btn">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="admin-breadcrumb">
            <span>Tổng quan hệ thống</span>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="revenue-section">
        <h2 className="section-title">
          <i className="fa fa-chart-line"></i> Doanh thu
        </h2>
        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="revenue-card-header">
              <span className="revenue-label">Hôm nay</span>
              {renderGrowthIndicator(stats?.revenue?.growth?.today)}
            </div>
            <div className="revenue-value">
              {formatCurrency(stats?.revenue?.today || 0)}
            </div>
            <div className="revenue-footer">
              <small>So với hôm qua</small>
            </div>
          </div>

          <div className="revenue-card">
            <div className="revenue-card-header">
              <span className="revenue-label">Tuần này</span>
              {renderGrowthIndicator(stats?.revenue?.growth?.week)}
            </div>
            <div className="revenue-value">
              {formatCurrency(stats?.revenue?.week || 0)}
            </div>
            <div className="revenue-footer">
              <small>So với tuần trước</small>
            </div>
          </div>

          <div className="revenue-card">
            <div className="revenue-card-header">
              <span className="revenue-label">Tháng này</span>
              {renderGrowthIndicator(stats?.revenue?.growth?.month)}
            </div>
            <div className="revenue-value">
              {formatCurrency(stats?.revenue?.month || 0)}
            </div>
            <div className="revenue-footer">
              <small>So với tháng trước</small>
            </div>
          </div>

          <div className="revenue-card revenue-card-total">
            <div className="revenue-card-header">
              <span className="revenue-label">Tổng doanh thu</span>
            </div>
            <div className="revenue-value">
              {formatCurrency(stats?.revenue?.total || 0)}
            </div>
            <div className="revenue-footer">
              <small>Tất cả thời gian</small>
            </div>
          </div>
        </div>
      </div>

      {/* Order Stats */}
      <div className="orders-section">
        <h2 className="section-title">
          <i className="fa fa-shopping-cart"></i> Đơn hàng
        </h2>
        <div className="stats-grid">
          <div className="stat-card stat-card-primary">
            <div className="stat-card-header">
              <div className="stat-card-content">
                <h3>Tổng đơn</h3>
                <p>{formatNumber(stats?.orders?.total || 0)}</p>
              </div>
              <div className="stat-card-icon">
                <i className="fa fa-shopping-bag"></i>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-warning">
            <div className="stat-card-header">
              <div className="stat-card-content">
                <h3>Chờ xử lý</h3>
                <p>{formatNumber(stats?.orders?.pending || 0)}</p>
              </div>
              <div className="stat-card-icon">
                <i className="fa fa-clock"></i>
              </div>
            </div>
            <div className="stat-card-footer">
              <Link to="/admin/orders?status=PENDING">Xem chi tiết →</Link>
            </div>
          </div>

          <div className="stat-card stat-card-info">
            <div className="stat-card-header">
              <div className="stat-card-content">
                <h3>Đang xử lý</h3>
                <p>{formatNumber(stats?.orders?.processing || 0)}</p>
              </div>
              <div className="stat-card-icon">
                <i className="fa fa-sync"></i>
              </div>
            </div>
            <div className="stat-card-footer">
              <Link to="/admin/orders?status=PROCESSING">Xem chi tiết →</Link>
            </div>
          </div>

          <div className="stat-card stat-card-success">
            <div className="stat-card-header">
              <div className="stat-card-content">
                <h3>Hoàn thành</h3>
                <p>{formatNumber(stats?.orders?.completed || 0)}</p>
              </div>
              <div className="stat-card-icon">
                <i className="fa fa-check-circle"></i>
              </div>
            </div>
            <div className="stat-card-footer">
              <Link to="/admin/orders?status=COMPLETED">Xem chi tiết →</Link>
            </div>
          </div>

          <div className="stat-card stat-card-danger">
            <div className="stat-card-header">
              <div className="stat-card-content">
                <h3>Đã hủy</h3>
                <p>{formatNumber(stats?.orders?.cancelled || 0)}</p>
              </div>
              <div className="stat-card-icon">
                <i className="fa fa-times-circle"></i>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-purple">
            <div className="stat-card-header">
              <div className="stat-card-content">
                <h3>Giá trị TB</h3>
                <p>{formatCurrency(stats?.orders?.average_order_value || 0)}</p>
              </div>
              <div className="stat-card-icon">
                <i className="fa fa-dollar-sign"></i>
              </div>
            </div>
            <div className="stat-card-footer">
              <small>Average Order Value</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-grid">
          <div className="chart-wrapper">
            <RevenueChart />
          </div>
          <div className="chart-wrapper">
            <OrderStatusChart />
          </div>
        </div>
      </div>

      {/* Top Products & Low Stock */}
      <div className="tables-section">
        <div className="tables-grid">
          {/* Top Products */}
          <div className="table-container">
            <div className="table-header">
              <h3>
                <i className="fa fa-trophy"></i> Top Sản phẩm bán chạy
              </h3>
              <Link to="/admin/products" className="view-all-link">
                Xem tất cả →
              </Link>
            </div>
            <div className="table-wrapper">
              {stats?.top_products?.length > 0 ? (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên sản phẩm</th>
                      <th>Đã bán</th>
                      <th>Doanh thu</th>
                      <th>Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_products.map((product, index) => (
                      <tr key={product.id}>
                        <td>
                          <span className="rank-badge">{index + 1}</span>
                          {product.code}
                        </td>
                        <td className="product-name">{product.name}</td>
                        <td>{formatNumber(product.total_sold)}</td>
                        <td className="revenue-cell">
                          {formatCurrency(product.total_revenue)}
                        </td>
                        <td>
                          <span className={product.stock_quantity < 10 ? 'stock-low' : 'stock-normal'}>
                            {formatNumber(product.stock_quantity)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <i className="fa fa-inbox"></i>
                  <p>Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="table-container">
            <div className="table-header">
              <h3>
                <i className="fa fa-exclamation-triangle"></i> Cảnh báo tồn kho thấp
              </h3>
              <Link to="/admin/stock" className="view-all-link">
                Quản lý kho →
              </Link>
            </div>
            <div className="table-wrapper">
              {stats?.low_stock?.length > 0 ? (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên sản phẩm</th>
                      <th>Tồn kho</th>
                      <th>Mức tối thiểu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.low_stock.map((product) => (
                      <tr key={product.id} className="low-stock-row">
                        <td>{product.code}</td>
                        <td className="product-name">{product.name}</td>
                        <td>
                          <span className="stock-critical">
                            {formatNumber(product.stock_quantity)}
                          </span>
                        </td>
                        <td>{formatNumber(product.min_stock_level)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state empty-state-success">
                  <i className="fa fa-check-circle"></i>
                  <p>Tất cả sản phẩm đều đủ hàng</p>
                </div>
              )}
            </div>
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
          <Link to="/admin/stock/import" className="quick-action-btn quick-action-stock">
            <i className="fa fa-download"></i> Nhập kho
          </Link>
          <Link to="/admin/coupons" className="quick-action-btn quick-action-coupons">
            <i className="fa fa-ticket-alt"></i> Mã giảm giá
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
