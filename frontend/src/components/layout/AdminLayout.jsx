import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import '../../styles/admin.css';

const AdminLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
          <h2>Admin TAWATCH</h2>
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
            Quản lý sản phẩm <span><i class="fa-solid fa-box"></i></span>
          </Link>
          <Link
            to="/admin/categories"
            className={`nav-item ${isActive('/admin/categories') ? 'active' : ''}`}
          >
            Quản lý danh mục <span><i class="fa-solid fa-list"></i></span>
          </Link>
          <Link
            to="/admin/brands"
            className={`nav-item ${isActive('/admin/brands') ? 'active' : ''}`}
          >
            Quản lý thương hiệu <span><i class="fa-solid fa-tag"></i></span>

          </Link>
          <Link
            to="/admin/orders"
            className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}
          >
            Quản lý đơn hàng <span><i class="fa-solid fa-receipt"></i></span>
          </Link>
          <Link
            to="/admin/coupons"
            className={`nav-item ${isActive('/admin/coupons') ? 'active' : ''}`}
          >
            Quản lý mã giảm giá <span><i class="fa-solid fa-ticket"></i></span>
          </Link>
          <Link
            to="/admin/notifications"
            className={`nav-item ${isActive('/admin/notifications') ? 'active' : ''}`}
          >
            Quản lý thông báo <span><i class="fa-solid fa-bell"></i></span>
          </Link>
          <Link
            to="/admin/suppliers"
            className={`nav-item ${isActive('/admin/suppliers') ? 'active' : ''}`}
          >
            Quản lý nhà cung cấp <span><i class="fa-solid fa-truck"></i></span>
          </Link>
          <Link
            to="/admin/stock"
            className={`nav-item ${isActive('/admin/stock') ? 'active' : ''}`}
          >
            Quản lý kho <span><i class="fa-solid fa-warehouse"></i></span>
          </Link>
          <Link
            to="/admin/users"
            className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
          >
            Quản lý người dùng <span><i class="fa-solid fa-users"></i></span>
          </Link>
          <Link
            to="/admin/reviews"
            className={`nav-item ${isActive('/admin/reviews') ? 'active' : ''}`}
          >
            Quản lý đánh giá <span><i class="fa-solid fa-star"></i></span>
          </Link>
        </nav>

        <div className="admin-footer">
          <button onClick={
            () => setShowLogoutConfirm(true)
          } className="btn-logout">
             Đăng xuất
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="admin-content">
        <Outlet />
      </main>
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Xác nhận đăng xuất</h3>
              <button
                className="modal-close"
                onClick={() => setShowLogoutConfirm(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>Bạn có chắc chắn muốn đăng xuất không?</p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Hủy
              </button>

              <button
                className="btn btn-danger"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                  navigate('/login');
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
