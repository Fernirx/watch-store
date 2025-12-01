import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP và mật khẩu mới
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});
    setLoading(true);

    try {
      await authService.sendForgotPasswordOtp(formData.email);
      setStep(2);
    } catch (err) {
      if (err.response?.status === 422) {
        const backendErrors = err.response?.data?.errors;
        if (backendErrors?.email) {
          if (backendErrors.email[0].includes('exists')) {
            setErrors({ email: ['Email này không tồn tại trong hệ thống.'] });
          } else {
            setErrors({ email: ['Email không hợp lệ.'] });
          }
        } else {
          setErrors({ general: 'Không thể gửi mã OTP. Vui lòng thử lại.' });
        }
      } else {
        setErrors({ general: 'Không thể gửi mã OTP. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(
        formData.email,
        formData.otp,
        formData.password,
        formData.password_confirmation
      );
      navigate('/login', { state: { message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' } });
    } catch (err) {
      if (err.response?.status === 400) {
        setErrors({ general: 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.' });
      } else if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const friendlyErrors = {};

        if (backendErrors.otp) {
          friendlyErrors.otp = ['Mã OTP không hợp lệ'];
        }
        if (backendErrors.password) {
          if (backendErrors.password[0].includes('at least 8')) {
            friendlyErrors.password = ['Mật khẩu phải có ít nhất 8 ký tự'];
          } else {
            friendlyErrors.password = ['Mật khẩu không hợp lệ'];
          }
        }

        setErrors(friendlyErrors);
      } else {
        setErrors({ general: 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Quên Mật Khẩu</h2>

        {errors.general && <div className="error-message">{errors.general}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} autoComplete="off">
            <p className="form-subtitle">
              Nhập email của bạn để nhận mã OTP khôi phục mật khẩu
            </p>

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

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi Mã OTP'}
            </button>

            <p className="auth-footer">
              <Link to="/login">Quay lại đăng nhập</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} autoComplete="off">
            <p className="form-subtitle">
              Mã OTP đã được gửi đến email: <strong>{formData.email}</strong>
            </p>

            <div className="form-group">
              <label>Mã OTP</label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength={6}
                placeholder="Nhập mã OTP (6 chữ số)"
                className={errors.otp ? 'input-error' : ''}
              />
              {errors.otp && <span className="field-error">{errors.otp[0]}</span>}
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Nhập mật khẩu mới"
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <span className="field-error">{errors.password[0]}</span>}
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Nhập lại mật khẩu mới"
                className={errors.password_confirmation ? 'input-error' : ''}
              />
              {errors.password_confirmation && <span className="field-error">{errors.password_confirmation}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
