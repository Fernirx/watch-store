import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import SearchBar from '../SearchBar';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemsCount } = useCart();
  const { wishlistItemsCount } = useWishlist();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleProfileMenu = () => setIsProfileOpen((prev) => !prev);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>Hưng Phú Store</h1>
          </Link>

          <nav className="nav-menu">
            <Link to="/">Trang Chủ</Link>
            <Link to="/products">Sản Phẩm</Link>
            <Link to="/notifications">Thông Báo</Link>
            {isAuthenticated && <Link to="/orders">Đơn Hàng</Link>}
          </nav>

          <div className="header-actions">
            <SearchBar
              placeholder="Tìm kiếm sản phẩm..."
              compact
              liveSearch
              onSubmit={(q) => {
                const query = q?.trim();
                if (query) {
                  navigate(`/products?search=${encodeURIComponent(query)}`);
                }
              }}
              onClear={() => navigate('/products')}
            />
            <Link to="/wishlist" className="wishlist-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistItemsCount > 0 && (
                <span className="wishlist-badge">{wishlistItemsCount}</span>
              )}
            </Link>

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
              <div className="user-menu" ref={profileMenuRef}>
                
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={toggleProfileMenu}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user?.customer?.name || 'User'}
                      className="profile-avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="profile-avatar"
                    aria-hidden
                    style={{ display: user?.avatar_url ? 'none' : 'flex' }}
                  >
                    {(user?.customer?.name?.charAt(0) || 'U').toUpperCase()}
                  </div>
                  <svg
                    className="profile-caret"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className="profile-dropdown" role="menu">
                    <div className="profile-meta">
                      <span className="profile-name">{user?.customer?.name || 'Người dùng'}</span>
                      {user?.email && <span className="profile-email">{user.email}</span>}
                    </div>
                    <Link
                      to="/profile"
                      className="profile-dropdown-link"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Quản lý profile
                    </Link>
                    <button
                      type="button"
                      className="profile-dropdown-link logout"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
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
    {/* ===== LOGOUT CONFIRM MODAL ===== */ }
  {
    showLogoutConfirm && (
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
    )
  }
    </>
  );
};

export default Header;
