import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>Hưng Phú Store</h1>
          </Link>

          <nav className="nav-menu">
            <Link to="/">Trang Chủ</Link>
            <Link to="/products">Sản Phẩm</Link>
            {isAuthenticated && <Link to="/orders">Đơn Hàng</Link>}
          </nav>

          <div className="header-actions">
            <Link to="/cart" className="cart-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 12.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="cart-badge">{cartItemsCount}</span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-name">{user?.name}</span>
                <Link to="/profile" className="btn-profile">
                  Tài Khoản
                </Link>
                <button onClick={handleLogout} className="btn-logout">
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">
                  Đăng Nhập
                </Link>
                <Link to="/register" className="btn-register">
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
