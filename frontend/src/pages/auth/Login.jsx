import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { API_BASE_URL } from '../../api/axiosConfig';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      const userRole = response?.data?.user?.role;

      // Redirect based on role
      if (userRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.log('Login error:', err.response); // Debug

      // Xử lý lỗi và chuyển sang tiếng Việt
      if (err.response?.status === 401) {
        setErrors({
          general: 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.'
        });
      } else if (err.response?.data?.errors) {
        // Lỗi validation từ backend
        const backendErrors = err.response.data.errors;
        const friendlyErrors = {};

        if (backendErrors.email) {
          friendlyErrors.email = backendErrors.email[0] === 'The email field is required.'
            ? ['Email là bắt buộc']
            : ['Email không hợp lệ'];
        }
        if (backendErrors.password) {
          friendlyErrors.password = backendErrors.password[0] === 'The password field is required.'
            ? ['Mật khẩu là bắt buộc']
            : ['Mật khẩu không hợp lệ'];
        }

        setErrors(friendlyErrors);
      } else {
        setErrors({
          general: 'Đăng nhập thất bại. Vui lòng thử lại.'
        });
      }
    } finally {
      setLoading(false);
    }

    return false;
  };

  const handleGoogleLogin = () => {
    authService.googleLogin();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng Nhập</h2>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {errors.general && <div className="error-message">{errors.general}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email của bạn"
              className={errors.email ? 'input-error' : ''}
              autoComplete="off"
            />
            {errors.email && <span className="field-error">{errors.email[0]}</span>}
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              className={errors.password ? 'input-error' : ''}
              autoComplete="off"
            />
            {errors.password && <span className="field-error">{errors.password[0]}</span>}
          </div>

          <div className="form-actions">
            <Link to="/forgot-password" className="forgot-link">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="divider">Hoặc</div>

        <button onClick={handleGoogleLogin} className="btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"></path>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"></path>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"></path>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"></path>
          </svg>
          Đăng nhập với Google
        </button>

        <p className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
