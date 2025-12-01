import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 phút

  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

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
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 400) {
        setErrors({
          general: 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại hoặc gửi lại mã mới.'
        });
      } else if (err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        if (backendErrors.otp) {
          setErrors({ otp: ['Mã OTP không hợp lệ. Vui lòng nhập đúng 6 chữ số.'] });
        } else {
          setErrors({ general: 'Có lỗi xảy ra. Vui lòng thử lại.' });
        }
      } else {
        setErrors({
          general: 'Xác thực thất bại. Vui lòng thử lại.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setErrors({});
    try {
      // Gọi lại API gửi OTP (cần implement trong authService nếu cần)
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
        <h2>Xác Thực OTP</h2>
        <p className="otp-subtitle">
          Mã OTP đã được gửi đến email: <strong>{email}</strong>
        </p>

        {errors.success && <div className="success-message">{errors.success}</div>}
        {errors.general && <div className="error-message">{errors.general}</div>}

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

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Mã OTP (6 chữ số)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="Nhập mã OTP"
              className={`otp-input ${errors.otp ? 'input-error' : ''}`}
            />
            {errors.otp && <span className="field-error">{errors.otp[0]}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || countdown === 0}>
            {loading ? 'Đang xác thực...' : 'Xác Thực'}
          </button>
        </form>

        <div className="resend-section">
          <p>Không nhận được mã?</p>
          <button
            onClick={handleResendOtp}
            className="btn-link"
            disabled={resendLoading || countdown > 240}
          >
            {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
