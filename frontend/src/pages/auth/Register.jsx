import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const Register = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email là bắt buộc';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Email không hợp lệ';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: [emailError] });
      return;
    }

    setLoading(true);

    try {
      // Bước 1: Gửi OTP đến email
      await authService.sendRegisterOtp(email);

      // Navigate đến trang verify OTP
      navigate('/verify-otp', {
        state: {
          email: email,
          fromRegister: true // Flag để biết là từ register flow
        }
      });
    } catch (err) {
      console.error('Send OTP error:', err);

      if (err.response?.data?.errors?.email) {
        const backendError = err.response.data.errors.email[0];
        if (backendError.includes('already been taken') || backendError.includes('đã được đăng ký')) {
          setErrors({ email: ['Email này đã được sử dụng. Vui lòng chọn email khác.'] });
        } else {
          setErrors({ email: ['Email không hợp lệ'] });
        }
      } else {
        setErrors({ general: err.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng Ký Tài Khoản</h2>
        <p className="auth-subtitle">Bước 1/3: Nhập email để nhận mã xác thực</p>

        {errors.general && <div className="error-message">{errors.general}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn"
              className={errors.email ? 'input-error' : ''}
              autoFocus
            />
            {errors.email && <span className="field-error">{errors.email[0]}</span>}
            <small className="field-hint">
              Chúng tôi sẽ gửi mã OTP (6 chữ số) đến email này
            </small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang gửi OTP...' : 'Tiếp Tục'}
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
