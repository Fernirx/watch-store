/**
 * Validation Utilities - Frontend
 *
 * Tập trung các validation patterns để khớp với backend
 * QUAN TRỌNG: Phải giữ sync với backend App\Rules\ValidationRules
 */

/**
 * Số điện thoại Việt Nam
 * Format: 0xxxxxxxxx (10 chữ số, đúng đầu số VN)
 * Đầu số hợp lệ: 032-039, 056-059, 070, 076-079, 081-089, 090-099
 * Ví dụ: 0912345678, 0987654321
 */
export const PHONE_VN_REGEX = /^(0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

/**
 * Email
 * Format: username@domain.ext
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mã sản phẩm
 * Format: Chữ cái, số, gạch ngang, gạch dưới (3-50 ký tự)
 */
export const PRODUCT_CODE_REGEX = /^[A-Z0-9_-]{3,50}$/i;

/**
 * Mã giảm giá (Coupon)
 * Format: Chữ in hoa, số, gạch dưới (_), gạch ngang (-) (3-50 ký tự)
 * Ví dụ: SALE2024, SUMMER_SALE, BLACK-FRIDAY
 */
export const COUPON_CODE_REGEX = /^[A-Z0-9_-]{3,50}$/;

/**
 * Giá tiền (VND)
 * Format: Số dương, tối đa 2 chữ số thập phân
 */
export const PRICE_REGEX = /^\d+(\.\d{1,2})?$/;

/**
 * Tên tiếng Việt
 * Format: Chữ cái tiếng Việt, khoảng trắng, gạch ngang
 * Min 2 ký tự, Max 100 ký tự
 */
export const NAME_VN_REGEX = /^[a-zA-ZÀ-ỹ\s\-]{2,100}$/;

/**
 * Mã bưu điện Việt Nam
 * Format: 6 chữ số
 */
export const POSTAL_CODE_VN_REGEX = /^\d{6}$/;

/**
 * Validate số điện thoại Việt Nam
 */
export const validatePhone = (phone) => {
  if (!phone) return false;

  // Loại bỏ khoảng trắng và gạch ngang
  const cleanPhone = phone.replace(/[\s-]/g, '');

  return PHONE_VN_REGEX.test(cleanPhone);
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate tên tiếng Việt
 */
export const validateName = (name) => {
  if (!name) return false;
  return NAME_VN_REGEX.test(name.trim());
};

/**
 * Validate mã giảm giá
 */
export const validateCouponCode = (code) => {
  if (!code) return false;
  return COUPON_CODE_REGEX.test(code.trim().toUpperCase());
};

/**
 * Validate giá
 */
export const validatePrice = (price) => {
  if (!price && price !== 0) return false;
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Validate số lượng (số nguyên dương)
 */
export const validateQuantity = (quantity) => {
  const num = parseInt(quantity);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

/**
 * Làm sạch số điện thoại (xóa khoảng trắng và gạch ngang)
 */
export const sanitizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s-]/g, '');
};

/**
 * Format số điện thoại để hiển thị
 * Input: 0912345678
 * Output: 091 234 5678
 */
export const formatPhone = (phone) => {
  if (!phone) return '';

  const clean = sanitizePhone(phone);

  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }

  if (clean.length === 11) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
  }

  return phone;
};

/**
 * Format giá sang tiền tệ Việt Nam
 * Input: 1000000
 * Output: 1.000.000đ
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return '0đ';
  return parseFloat(price).toLocaleString('vi-VN') + 'đ';
};

/**
 * Validate địa chỉ (tối thiểu 10 ký tự)
 */
export const validateAddress = (address) => {
  if (!address) return false;
  return address.trim().length >= 10;
};

/**
 * Lấy thông báo lỗi validation
 */
export const getValidationErrorMessage = (field, value) => {
  const messages = {
    name: 'Tên phải có từ 2-100 ký tự, chỉ chứa chữ cái tiếng Việt, khoảng trắng và dấu gạch ngang',
    email: 'Email không hợp lệ (ví dụ: example@gmail.com)',
    phone: 'Số điện thoại không hợp lệ (ví dụ: 0912345678)',
    address: 'Địa chỉ phải có ít nhất 10 ký tự',
    price: 'Giá phải là số dương',
    quantity: 'Số lượng phải là số nguyên dương',
    couponCode: 'Mã giảm giá không đúng định dạng (chỉ chữ in hoa, số, gạch dưới và gạch ngang, 3-50 ký tự)',
  };

  return messages[field] || 'Giá trị không hợp lệ';
};

/**
 * Validate toàn bộ form
 */
export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];

    // Validation bắt buộc
    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${fieldRules.label || field} là bắt buộc`;
      return;
    }

    // Bỏ qua validation nếu field rỗng và không bắt buộc
    if (!value && !fieldRules.required) return;

    // Validation theo loại
    switch (fieldRules.type) {
      case 'email':
        if (!validateEmail(value)) {
          errors[field] = getValidationErrorMessage('email');
        }
        break;

      case 'phone':
        if (!validatePhone(value)) {
          errors[field] = getValidationErrorMessage('phone');
        }
        break;

      case 'name':
        if (!validateName(value)) {
          errors[field] = getValidationErrorMessage('name');
        }
        break;

      case 'address':
        if (!validateAddress(value)) {
          errors[field] = getValidationErrorMessage('address');
        }
        break;

      case 'price':
        if (!validatePrice(value)) {
          errors[field] = getValidationErrorMessage('price');
        }
        break;

      case 'quantity':
        if (!validateQuantity(value)) {
          errors[field] = getValidationErrorMessage('quantity');
        }
        break;
    }

    // Validation độ dài tối thiểu/tối đa
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} phải có ít nhất ${fieldRules.minLength} ký tự`;
    }

    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} không được vượt quá ${fieldRules.maxLength} ký tự`;
    }

    // Custom validation function
    if (fieldRules.custom && !fieldRules.custom(value)) {
      errors[field] = fieldRules.customMessage || 'Giá trị không hợp lệ';
    }
  });

  return errors;
};

export default {
  validatePhone,
  validateEmail,
  validateName,
  validateCouponCode,
  validatePrice,
  validateQuantity,
  validateAddress,
  sanitizePhone,
  formatPhone,
  formatPrice,
  validateForm,
  getValidationErrorMessage,
};
