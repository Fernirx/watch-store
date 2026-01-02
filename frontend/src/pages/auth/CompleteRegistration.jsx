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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Validate name - Chỉ chữ cái tiếng Việt và khoảng trắng
    if (!formData.name.trim()) {
      newErrors.name = ['Họ tên là bắt buộc'];
    } else if (formData.name.trim().length < 2) {
      newErrors.name = ['Họ tên phải có ít nhất 2 ký tự'];
    } else if (formData.name.trim().length > 100) {
      newErrors.name = ['Họ tên không được vượt quá 100 ký tự'];
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(formData.name.trim())) {
      newErrors.name = ['Họ tên chỉ được chứa chữ cái và khoảng trắng'];
    }

    // Validate password - Mật khẩu mạnh (chữ hoa, thường, số)
    if (!formData.password) {
      newErrors.password = ['Mật khẩu là bắt buộc'];
    } else if (formData.password.length < 8) {
      newErrors.password = ['Mật khẩu phải có ít nhất 8 ký tự'];
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = ['Mật khẩu phải có ít nhất 1 chữ thường'];
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = ['Mật khẩu phải có ít nhất 1 chữ hoa'];
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = ['Mật khẩu phải có ít nhất 1 số'];
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
      navigate('/login');
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                className={errors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password[0]}</span>}
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Nhập lại mật khẩu"
                className={errors.password_confirmation ? 'input-error' : ''}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
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
