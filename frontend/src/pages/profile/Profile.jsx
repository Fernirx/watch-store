import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { profileService, addressService } from '../../services';
import '../../styles/Profile.css';

const Profile = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();

    // Profile state
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    // Address state
    const [addressData, setAddressData] = useState({
        recipient_name: '',
        phone: '',
        street: '',
        ward: '',
        city: '',
        postal_code: '',
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
    const [activeTab, setActiveTab] = useState('profile'); // profile | address | password
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [hasAddress, setHasAddress] = useState(false);
    const [addressId, setAddressId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchProfile();
        fetchAddress();
    }, [isAuthenticated]);

    const fetchProfile = async () => {
        try {
            const response = await profileService.getProfile();
            if (response.success) {
                const userData = response.data;
                setProfileData({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                });
                setAvatarPreview(userData.avatar_url);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchAddress = async () => {
        try {
            const response = await addressService.getDefaultAddress();
            if (response.success && response.data) {
                const addr = response.data;
                setAddressData({
                    recipient_name: addr.recipient_name || '',
                    phone: addr.phone || '',
                    street: addr.street || '',
                    ward: addr.ward || '',
                    city: addr.city || '',
                    postal_code: addr.postal_code || '',
                });
                setHasAddress(true);
                setAddressId(addr.id);
            }
        } catch (error) {
            console.error('Failed to fetch address:', error);
            setHasAddress(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleAddressChange = (e) => {
        setAddressData({ ...addressData, [e.target.name]: e.target.value });
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
            // Update profile (avatar đã upload tự động khi chọn file)
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

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            let response;
            if (hasAddress && addressId) {
                // Update existing address
                response = await addressService.updateAddress(addressId, addressData);
            } else {
                // Create new address
                response = await addressService.createAddress({
                    ...addressData,
                    is_default: true,
                });
            }

            if (response.success) {
                setMessage({ type: 'success', text: 'Cập nhật địa chỉ thành công!' });
                if (!hasAddress) {
                    setHasAddress(true);
                    setAddressId(response.data.id);
                }
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Cập nhật địa chỉ thất bại'
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
        if (!window.confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return;

        try {
            const response = await profileService.deleteAvatar();
            if (response.success) {
                setAvatarPreview(null);
                setMessage({ type: 'success', text: 'Xóa ảnh đại diện thành công!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Xóa ảnh đại diện thất bại' });
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-wrapper">
                <h1>Quản lý tài khoản</h1>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={activeTab === 'profile' ? 'active' : ''}
                        onClick={() => setActiveTab('profile')}
                    >
                        Thông tin cá nhân
                    </button>
                    <button
                        className={activeTab === 'address' ? 'active' : ''}
                        onClick={() => setActiveTab('address')}
                    >
                        Địa chỉ giao hàng
                    </button>
                    <button
                        className={activeTab === 'password' ? 'active' : ''}
                        onClick={() => setActiveTab('password')}
                    >
                        Đổi mật khẩu
                    </button>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="profile-form">
                        <div className="avatar-section">
                            <div className="avatar-preview">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="avatar-actions">
                                <label htmlFor="avatar-upload" className="btn-upload">
                                    {loading ? 'Đang tải...' : 'Chọn ảnh'}
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/gif"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                    disabled={loading}
                                />
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    Tự động upload khi chọn (max 2MB)
                                </small>
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteAvatar}
                                        className="btn-delete"
                                        disabled={loading}
                                    >
                                        Xóa ảnh
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Họ tên</label>
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
                            />
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                placeholder="0912345678"
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </form>
                )}

                {/* Address Tab */}
                {activeTab === 'address' && (
                    <form onSubmit={handleAddressSubmit} className="profile-form">
                        <div className="form-group">
                            <label>Tên người nhận</label>
                            <input
                                type="text"
                                name="recipient_name"
                                value={addressData.recipient_name}
                                onChange={handleAddressChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                                type="tel"
                                name="phone"
                                value={addressData.phone}
                                onChange={handleAddressChange}
                                placeholder="0912345678"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Địa chỉ chi tiết (số nhà, tên đường)</label>
                            <input
                                type="text"
                                name="street"
                                value={addressData.street}
                                onChange={handleAddressChange}
                                placeholder="123 Lê Lợi"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Phường/Xã</label>
                                <input
                                    type="text"
                                    name="ward"
                                    value={addressData.ward}
                                    onChange={handleAddressChange}
                                    placeholder="Phường Bến Nghé"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Tỉnh/Thành phố</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={addressData.city}
                                    onChange={handleAddressChange}
                                    placeholder="TP. Hồ Chí Minh"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Mã bưu điện (tùy chọn)</label>
                            <input
                                type="text"
                                name="postal_code"
                                value={addressData.postal_code}
                                onChange={handleAddressChange}
                                placeholder="700000"
                                maxLength="6"
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Đang lưu...' : hasAddress ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
                        </button>
                    </form>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="profile-form">
                        <div className="form-group">
                            <label>Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                name="current_password"
                                value={passwordData.current_password}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                name="new_password"
                                value={passwordData.new_password}
                                onChange={handlePasswordChange}
                                minLength="8"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                name="new_password_confirmation"
                                value={passwordData.new_password_confirmation}
                                onChange={handlePasswordChange}
                                minLength="8"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;