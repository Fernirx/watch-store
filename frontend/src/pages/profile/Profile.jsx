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
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('profile'); // profile | password
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const validateProfileForm = () => {
        const newErrors = {};

        // Validate name (required) - Cho phép chữ cái tiếng Việt, khoảng trắng
        if (!profileData.name.trim()) {
            newErrors.name = 'Họ tên là bắt buộc';
        } else if (profileData.name.trim().length < 2) {
            newErrors.name = 'Họ tên phải có ít nhất 2 ký tự';
        } else if (profileData.name.trim().length > 100) {
            newErrors.name = 'Họ tên không được vượt quá 100 ký tự';
        } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(profileData.name.trim())) {
            newErrors.name = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
        }

        // Validate shipping_name (optional, max 200) - Cho phép chữ cái tiếng Việt, khoảng trắng
        if (profileData.shipping_name.trim()) {
            if (profileData.shipping_name.trim().length > 200) {
                newErrors.shipping_name = 'Tên người nhận không được vượt quá 200 ký tự';
            } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/.test(profileData.shipping_name.trim())) {
                newErrors.shipping_name = 'Tên người nhận chỉ được chứa chữ cái và khoảng trắng';
            }
        }

        // Validate shipping_phone (optional, max 15, regex Vietnamese phone)
        if (profileData.shipping_phone.trim()) {
            if (profileData.shipping_phone.length > 15) {
                newErrors.shipping_phone = 'Số điện thoại không được vượt quá 15 ký tự';
            } else {
                const phone = profileData.shipping_phone.replace(/[\s-]/g, '');
                // Validate Vietnamese phone number (10 digits: 03x, 05x, 07x, 08x, 09x)
                if (!/^(0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(phone)) {
                    newErrors.shipping_phone = 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0912345678)';
                }
            }
        }

        // Validate shipping_address (optional, min 10 chars) - Cho phép chữ, số, dấu câu phổ biến
        if (profileData.shipping_address.trim()) {
            if (profileData.shipping_address.trim().length < 10) {
                newErrors.shipping_address = 'Địa chỉ phải có ít nhất 10 ký tự';
            } else if (!/^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s,.\-/()]+$/.test(profileData.shipping_address.trim())) {
                newErrors.shipping_address = 'Địa chỉ chứa ký tự không hợp lệ';
            }
        }

        return newErrors;
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const validatePasswordForm = () => {
        const newErrors = {};

        // Validate current password
        if (!passwordData.current_password) {
            newErrors.current_password = 'Mật khẩu hiện tại là bắt buộc';
        }

        // Validate new password - Yêu cầu mật khẩu mạnh
        if (!passwordData.new_password) {
            newErrors.new_password = 'Mật khẩu mới là bắt buộc';
        } else if (passwordData.new_password.length < 8) {
            newErrors.new_password = 'Mật khẩu phải có ít nhất 8 ký tự';
        } else if (!/(?=.*[a-z])/.test(passwordData.new_password)) {
            newErrors.new_password = 'Mật khẩu phải có ít nhất 1 chữ thường';
        } else if (!/(?=.*[A-Z])/.test(passwordData.new_password)) {
            newErrors.new_password = 'Mật khẩu phải có ít nhất 1 chữ hoa';
        } else if (!/(?=.*\d)/.test(passwordData.new_password)) {
            newErrors.new_password = 'Mật khẩu phải có ít nhất 1 số';
        }

        // Validate password confirmation
        if (!passwordData.new_password_confirmation) {
            newErrors.new_password_confirmation = 'Xác nhận mật khẩu là bắt buộc';
        } else if (passwordData.new_password !== passwordData.new_password_confirmation) {
            newErrors.new_password_confirmation = 'Mật khẩu xác nhận không khớp';
        }

        return newErrors;
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
        setUploadingAvatar(true);
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
            setUploadingAvatar(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validate form trước khi submit
        const validationErrors = validateProfileForm();
        if (Object.keys(validationErrors).length > 0) {
            setMessage({ type: 'error', text: Object.values(validationErrors)[0] });
            return;
        }

        setLoading(true);

        try {
            const response = await profileService.updateProfile(profileData);
            if (response.success) {
                setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
                updateUser(response.data);
            }
        } catch (error) {
            console.error('Profile update error:', error);

            // Xử lý lỗi từ backend
            if (error.response?.data?.errors) {
                const backendErrors = error.response.data.errors;
                // Hiển thị lỗi đầu tiên
                const firstError = Object.values(backendErrors)[0];
                setMessage({
                    type: 'error',
                    text: Array.isArray(firstError) ? firstError[0] : firstError
                });
            } else {
                const errorMsg = error.response?.data?.message || 'Cập nhật thông tin thất bại';
                setMessage({ type: 'error', text: errorMsg });
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validate form trước khi submit
        const validationErrors = validatePasswordForm();
        if (Object.keys(validationErrors).length > 0) {
            setMessage({ type: 'error', text: Object.values(validationErrors)[0] });
            return;
        }

        setLoading(true);

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

        setUploadingAvatar(true);
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
            setUploadingAvatar(false);
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
                                <div className={`avatar-preview ${uploadingAvatar ? 'uploading' : ''}`}>
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user?.customer?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    {uploadingAvatar && (
                                        <div className="avatar-upload-overlay">
                                            <div className="upload-spinner"></div>
                                            <span className="upload-text">Đang upload...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="avatar-actions">
                                    <label
                                        htmlFor="avatar-upload"
                                        className={`btn-upload ${uploadingAvatar ? 'disabled' : ''}`}
                                    >
                                        {uploadingAvatar ? 'Đang upload...' : 'Chọn Ảnh'}
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                            disabled={uploadingAvatar}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {avatarPreview && !uploadingAvatar && (
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
                                <div className="password-input-wrapper">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    >
                                        {showCurrentPassword ? (
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
                            </div>

                            <div className="form-group">
                                <label>Mật khẩu mới *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    >
                                        {showNewPassword ? (
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
                            </div>

                            <div className="form-group">
                                <label>Xác nhận mật khẩu mới *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="new_password_confirmation"
                                        value={passwordData.new_password_confirmation}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={8}
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
