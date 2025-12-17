import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh_token');
    const userStr = searchParams.get('user');

    if (token && refreshToken && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        // Lưu tokens và user vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Cập nhật Auth context
        if (setUser) {
          setUser(user);
        }

        // Redirect based on role
        if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing Google callback:', error);
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="loading">
      Đang đăng nhập với Google...
    </div>
  );
};

export default GoogleCallback;
