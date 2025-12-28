import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services';
import '../../styles/Profile.css';

const Profile = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();

    // Profile state (bao gồm cả shipping address)
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        shipping_name: '',
        shipping_phone: '',
        shipping_address: '',
    });

    // Password state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('profile'); // profile | password
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchProfile();
    }, [isAuthenticated]);

    const fetchProfile = async () => {
        try {
            const response = await profileService.getProfile();
            if (response.success) {
                const userData = response.data;
                const customer = userData.customer || {};
                setProfileData({
                    name: customer.name || '',
                    email: userData.email || '',
                    shipping_name: customer.shipping_name || '',
                    shipping_phone: customer.shipping_phone || '',
                    shipping_address: customer.shipping_address || '',
                });
                setAvatarPreview(userData.avatar_url);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2048000) { // 2MB
            setMessage({ type: 'error', text: 'Kích thước ảnh không được vượt quá 2MB' });
            return;
        }

        // Preview ngay
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarFile(file);

        // Upload luôn
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const avatarResponse = await profileService.uploadAvatar(file);
            if (avatarResponse.success) {
                setMessage({ type: 'success', text: 'Upload avatar thành công!' });
                setAvatarPreview(avatarResponse.data.avatar_url);
                if (user) {
                    updateUser({ ...user, avatar_url: avatarResponse.data.avatar_url });
                }
                setAvatarFile(null);
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            const errorMsg = error.response?.data?.message ||
                error.response?.data?.errors?.avatar?.[0] ||
                'Upload avatar thất bại: ' + (error.message || 'Unknown error');
            setMessage({ type: 'error', text: errorMsg });
            setAvatarPreview(user?.avatar_url || null); // Rollback preview
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await profileService.updateProfile(profileData);
            if (response.success) {
                setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
                updateUser(response.data);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            const errorMsg = error.response?.data?.message ||
                error.response?.data?.errors ||
                'Cập nhật thông tin thất bại';
            setMessage({
                type: 'error',
                text: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            setMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
            setLoading(false);
            return;
        }

        try {
            const response = await profileService.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                new_password_confirmation: passwordData.new_password_confirmation,
            });

            if (response.success) {
                setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Đổi mật khẩu thất bại'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa avatar?')) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await profileService.deleteAvatar();
            if (response.success) {
                setMessage({ type: 'success', text: 'Xóa avatar thành công!' });
                setAvatarPreview(null);
                if (user) {
                    updateUser({ ...user, avatar_url: null });
                }
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Xóa avatar thất bại'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="container">
                <h1>Tài Khoản Của Tôi</h1>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="profile-tabs">
                    <button
                        className={activeTab === 'profile' ? 'active' : ''}
                        onClick={() => setActiveTab('profile')}
                    >
                        Thông Tin Cá Nhân
                    </button>
                    <button
                        className={activeTab === 'password' ? 'active' : ''}
                        onClick={() => setActiveTab('password')}
                    >
                        Đổi Mật Khẩu
                    </button>
                </div>

                <div className="profile-content">
                    {/* Tab Thông Tin Cá Nhân */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSubmit} className="profile-form">
                            <h2>Thông Tin Cá Nhân</h2>

                            {/* Avatar */}
                            <div className="avatar-section">
                                <div className="avatar-preview">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user?.customer?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="avatar-actions">
                                    <label htmlFor="avatar-upload" className="btn-upload">
                                        Chọn Ảnh
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {avatarPreview && (
                                        <button type="button" onClick={handleDeleteAvatar} className="btn-delete">
                                            Xóa Avatar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin cơ bản */}
                            <div className="form-group">
                                <label>Họ và tên *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profileData.name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleProfileChange}
                                    required
                                    readOnly
                                    disabled
                                    style={{
                                        backgroundColor: '#f3f4f6',
                                        cursor: 'not-allowed',
                                        opacity: 0.7
                                    }}
                                />
                                <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                                    Email không thể thay đổi
                                </small>
                            </div>

                            <hr style={{ margin: '2rem 0', border: '1px solid #e5e7eb' }} />

                            {/* Địa chỉ giao hàng */}
                            <h3>Địa Chỉ Giao Hàng Mặc Định</h3>

                            <div className="form-group">
                                <label>Tên người nhận</label>
                                <input
                                    type="text"
                                    name="shipping_name"
                                    value={profileData.shipping_name}
                                    onChange={handleProfileChange}
                                    placeholder="Tên người nhận hàng"
                                />
                            </div>

                            <div className="form-group">
                                <label>Số điện thoại nhận hàng</label>
                                <input
                                    type="tel"
                                    name="shipping_phone"
                                    value={profileData.shipping_phone}
                                    onChange={handleProfileChange}
                                    placeholder="Số điện thoại để shipper liên lạc"
                                />
                            </div>

                            <div className="form-group">
                                <label>Địa chỉ giao hàng</label>
                                <textarea
                                    name="shipping_address"
                                    value={profileData.shipping_address}
                                    onChange={handleProfileChange}
                                    rows="3"
                                    placeholder="Địa chỉ đầy đủ (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                                />
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Đang cập nhật...' : 'Cập Nhật Thông Tin'}
                            </button>
                        </form>
                    )}

                    {/* Tab Đổi Mật Khẩu */}
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="password-form">
                            <h2>Đổi Mật Khẩu</h2>

                            <div className="form-group">
                                <label>Mật khẩu hiện tại *</label>
                                <input
                                    type="password"
                                    name="current_password"
                                    value={passwordData.current_password}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Mật khẩu mới *</label>
                                <input
                                    type="password"
                                    name="new_password"
                                    value={passwordData.new_password}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="form-group">
                                <label>Xác nhận mật khẩu mới *</label>
                                <input
                                    type="password"
                                    name="new_password_confirmation"
                                    value={passwordData.new_password_confirmation}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
