import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

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

    // Kiểm tra mật khẩu khớp
    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.password_confirmation
      );
      // Chuyển đến trang xác thực OTP
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      // Xử lý lỗi validation từ Laravel và chuyển sang tiếng Việt
      if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const friendlyErrors = {};

        if (backendErrors.name) {
          friendlyErrors.name = ['Họ tên là bắt buộc'];
        }
        if (backendErrors.email) {
          if (backendErrors.email[0].includes('already been taken')) {
            friendlyErrors.email = ['Email này đã được sử dụng. Vui lòng chọn email khác.'];
          } else if (backendErrors.email[0].includes('valid email')) {
            friendlyErrors.email = ['Email không hợp lệ'];
          } else {
            friendlyErrors.email = ['Email là bắt buộc'];
          }
        }
        if (backendErrors.password) {
          if (backendErrors.password[0].includes('at least 8')) {
            friendlyErrors.password = ['Mật khẩu phải có ít nhất 8 ký tự'];
          } else if (backendErrors.password[0].includes('confirmation')) {
            friendlyErrors.password = ['Mật khẩu xác nhận không khớp'];
          } else {
            friendlyErrors.password = ['Mật khẩu là bắt buộc'];
          }
        }

        setErrors(friendlyErrors);
      } else {
        setErrors({ general: 'Đăng ký thất bại. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }

    return false;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng Ký Tài Khoản</h2>

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
            />
            {errors.name && <span className="field-error">{errors.name[0]}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Nhập email của bạn"
              className={errors.email ? 'input-error' : ''}
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
            {errors.password_confirmation && <span className="field-error">{errors.password_confirmation}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tiếp Tục'}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
