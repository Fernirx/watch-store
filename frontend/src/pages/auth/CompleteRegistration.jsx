import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../../services/authService';

const CompleteRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    // Nếu không có email, redirect về register
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = ['Họ tên là bắt buộc'];
    } else if (formData.name.trim().length < 2) {
      newErrors.name = ['Họ tên phải có ít nhất 2 ký tự'];
    } else if (formData.name.trim().length > 100) {
      newErrors.name = ['Họ tên không được vượt quá 100 ký tự'];
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = ['Mật khẩu là bắt buộc'];
    } else if (formData.password.length < 8) {
      newErrors.password = ['Mật khẩu phải có ít nhất 8 ký tự'];
    }

    // Validate password confirmation
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Mật khẩu xác nhận không khớp';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      await authService.completeRegistration(
        email,
        formData.name,
        formData.password,
        formData.password_confirmation
      );

      // Đăng ký thành công → redirect về home
      navigate('/');
    } catch (err) {
      console.error('Complete registration error:', err);

      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const friendlyErrors = {};

        if (backendErrors.name) {
          friendlyErrors.name = ['Họ tên là bắt buộc'];
        }
        if (backendErrors.password) {
          if (backendErrors.password[0].includes('at least 8')) {
            friendlyErrors.password = ['Mật khẩu phải có ít nhất 8 ký tự'];
          } else if (backendErrors.password[0].includes('confirmation')) {
            friendlyErrors.password_confirmation = 'Mật khẩu xác nhận không khớp';
          } else {
            friendlyErrors.password = ['Mật khẩu là bắt buộc'];
          }
        }

        setErrors(friendlyErrors);
      } else {
        setErrors({
          general: err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Hoàn Tất Đăng Ký</h2>
        <p className="auth-subtitle">Bước 3/3: Tạo tài khoản của bạn</p>

        {email && (
          <div className="info-box">
            Email: <strong>{email}</strong>
          </div>
        )}

        {errors.general && <div className="error-message">{errors.general}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Nhập họ tên của bạn"
              className={errors.name ? 'input-error' : ''}
              autoFocus
            />
            {errors.name && <span className="field-error">{errors.name[0]}</span>}
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password[0]}</span>}
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Nhập lại mật khẩu"
              className={errors.password_confirmation ? 'input-error' : ''}
            />
            {errors.password_confirmation && (
              <span className="field-error">{errors.password_confirmation}</span>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Hoàn Tất Đăng Ký'}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default CompleteRegistration;
