import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import '../../styles/admin.css';

const AdminLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'ADMIN') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2> Watch Store</h2>
          <p>{user?.name}</p>
        </div>

        <nav className="admin-nav">
          <Link
            to="/admin"
            className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
          >
            Dashboard  <span><i class="fa-solid fa-chart-line"></i></span> 
          </Link>
          <Link
            to="/admin/products"
            className={`nav-item ${isActive('/admin/products') ? 'active' : ''}`}
          >
             Sản phẩm <span><i class="fa-solid fa-box"></i></span>
          </Link>
          <Link
            to="/admin/categories"
            className={`nav-item ${isActive('/admin/categories') ? 'active' : ''}`}
          >
            Danh mục <span><i class="fa-solid fa-list"></i></span>
          </Link>
          <Link
            to="/admin/brands"
            className={`nav-item ${isActive('/admin/brands') ? 'active' : ''}`}
          >
            Thương hiệu <span><i class="fa-solid fa-tag"></i></span>

          </Link>
          <Link
            to="/admin/orders"
            className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}
          >
            Đơn hàng <span><i class="fa-solid fa-receipt"></i></span>
          </Link>
          <Link
            to="/admin/coupons"
            className={`nav-item ${isActive('/admin/coupons') ? 'active' : ''}`}
          >
            Mã giảm giá <span><i class="fa-solid fa-ticket"></i></span>
          </Link>
          <Link
            to="/admin/notifications"
            className={`nav-item ${isActive('/admin/notifications') ? 'active' : ''}`}
          >
            Thông báo <span><i class="fa-solid fa-bell"></i></span>
          </Link>
          <Link
            to="/admin/users"
            className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
          >
            Người dùng <span><i class="fa-solid fa-users"></i></span>
          </Link>
        </nav>

        <div className="admin-footer">
          <Link to="/" className="nav-item">
             Xem trang web
          </Link>
          <button onClick={handleLogout} className="btn-logout">
             Đăng xuất
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
