// Helper function để dịch lỗi từ backend sang tiếng Việt

const errorMessages = {
  // Email errors
  'The email field is required.': 'Email là bắt buộc',
  'The email must be a valid email address.': 'Email không hợp lệ',
  'The email has already been taken.': 'Email này đã được sử dụng. Vui lòng chọn email khác.',
  'The selected email is invalid.': 'Email không tồn tại trong hệ thống',

  // Password errors
  'The password field is required.': 'Mật khẩu là bắt buộc',
  'The password must be at least 8 characters.': 'Mật khẩu phải có ít nhất 8 ký tự',
  'The password confirmation does not match.': 'Mật khẩu xác nhận không khớp',

  // Name errors
  'The name field is required.': 'Họ tên là bắt buộc',

  // OTP errors
  'The otp field is required.': 'Mã OTP là bắt buộc',
  'The otp must be 6 characters.': 'Mã OTP phải có 6 chữ số',

  // General errors
  'Invalid credentials': 'Email hoặc mật khẩu không đúng',
  'Invalid or expired OTP': 'Mã OTP không đúng hoặc đã hết hạn',
};

export const translateError = (errorMessage) => {
  // Kiểm tra exact match
  if (errorMessages[errorMessage]) {
    return errorMessages[errorMessage];
  }

  // Kiểm tra partial match
  for (const [key, value] of Object.entries(errorMessages)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Nếu không tìm thấy, trả về message mặc định
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
};

export const translateBackendErrors = (backendErrors) => {
  const friendlyErrors = {};

  for (const [field, messages] of Object.entries(backendErrors)) {
    friendlyErrors[field] = messages.map(msg => translateError(msg));
  }

  return friendlyErrors;
};
