import { useState, useEffect } from 'react';
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
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 phút
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2) {
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateEmailForm = () => {
    const newErrors = {};

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = ['Email là bắt buộc'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ['Email không hợp lệ'];
    }

    return newErrors;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    // Validate form trước khi gửi OTP
    const validationErrors = validateEmailForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      await authService.sendForgotPasswordOtp(formData.email);
      setStep(2);
    } catch (err) {
      if (err.response?.status === 422) {
        const backendErrors = err.response?.data?.errors;
        if (backendErrors?.email) {
          // Hiển thị message từ backend (đã custom ở controller)
          setErrors({ email: backendErrors.email });
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

  const validateResetForm = () => {
    const newErrors = {};

    // Validate OTP
    if (!formData.otp.trim()) {
      newErrors.otp = ['Mã OTP là bắt buộc'];
    } else if (!/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = ['Mã OTP phải là 6 chữ số'];
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = ['Mật khẩu mới là bắt buộc'];
    } else if (formData.password.length < 8) {
      newErrors.password = ['Mật khẩu phải có ít nhất 8 ký tự'];
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = ['Mật khẩu phải chứa chữ hoa, chữ thường và số'];
    }

    // Validate password confirmation
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Mật khẩu xác nhận không khớp';
    }

    return newErrors;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});

    // Validate form trước khi reset password
    const validationErrors = validateResetForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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

  const handleResendOtp = async () => {
    setResendLoading(true);
    setErrors({});
    try {
      await authService.resendForgotPasswordOtp(formData.email);
      setCountdown(300);
      setErrors({ success: 'Mã OTP mới đã được gửi đến email của bạn' });
    } catch (err) {
      setErrors({ general: 'Không thể gửi lại mã OTP. Vui lòng thử lại.' });
    } finally {
      setResendLoading(false);
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
          <>
            <form onSubmit={handleResetPassword} autoComplete="off">
              <p className="form-subtitle">
                Mã OTP đã được gửi đến email: <strong>{formData.email}</strong>
              </p>

              {errors.success && <div className="success-message">{errors.success}</div>}

              {countdown > 0 && (
                <div className="countdown">
                  Mã OTP có hiệu lực trong: <strong>{formatTime(countdown)}</strong>
                </div>
              )}

              {countdown === 0 && (
                <div className="error-message">
                  Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.
                </div>
              )}

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
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    placeholder="Nhập mật khẩu mới"
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
                <label>Xác nhận mật khẩu mới</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required
                    minLength={8}
                    placeholder="Nhập lại mật khẩu mới"
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
                {errors.password_confirmation && <span className="field-error">{errors.password_confirmation}</span>}
              </div>

              <button type="submit" className="btn-primary" disabled={loading || countdown === 0}>
                {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
              </button>
            </form>

            <div className="resend-section">
              <p>Không nhận được mã?</p>
              {countdown > 240 ? (
                <p className="resend-countdown">
                  Bạn có thể gửi lại sau <strong>{countdown - 240}s</strong>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="btn-link"
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
