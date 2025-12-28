<?php

namespace App\Rules;

/**
 * Validation Rules - Tập trung các pattern validation
 *
 * Đảm bảo consistency giữa backend và frontend validation
 */
class ValidationRules
{
    /**
     * Số điện thoại Việt Nam
     * Format: 0xxxxxxxxx (10-11 chữ số, bắt đầu bằng 0)
     * Ví dụ: 0912345678, 0987654321, 01234567890
     */
    const PHONE_VN = '/^0\d{9,10}$/';

    /**
     * Email
     * Format: username@domain.ext
     */
    const EMAIL = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';

    /**
     * Mã sản phẩm
     * Format: Chữ cái, số, gạch ngang, gạch dưới (3-50 ký tự)
     * Ví dụ: WA-001, SEIKO_SKX007, Casio123
     */
    const PRODUCT_CODE = '/^[A-Z0-9_-]{3,50}$/i';

    /**
     * Mã giảm giá (Coupon)
     * Format: Chữ in hoa, số (3-50 ký tự)
     * Ví dụ: SUMMER2024, NEWYEAR, FLASHSALE50
     */
    const COUPON_CODE = '/^[A-Z0-9]{3,50}$/';

    /**
     * Giá tiền (VND)
     * Format: Số dương, tối đa 2 chữ số thập phân
     * Ví dụ: 1000000, 1500000.50
     */
    const PRICE = '/^\d+(\.\d{1,2})?$/';

    /**
     * Tên tiếng Việt
     * Format: Chữ cái tiếng Việt, khoảng trắng, gạch ngang
     * Min 2 ký tự, Max 100 ký tự
     */
    const NAME_VN = '/^[a-zA-ZÀ-ỹ\s\-]{2,100}$/u';

    /**
     * Mã bưu điện Việt Nam
     * Format: 6 chữ số
     * Ví dụ: 700000, 100000
     */
    const POSTAL_CODE_VN = '/^\d{6}$/';

    /**
     * Lấy Laravel validation rule cho số điện thoại
     */
    public static function phoneRule(): string
    {
        return 'regex:' . self::PHONE_VN;
    }

    /**
     * Lấy Laravel validation rule cho email
     */
    public static function emailRule(): string
    {
        return 'email:rfc,dns';
    }

    /**
     * Lấy Laravel validation rule cho mã sản phẩm
     */
    public static function productCodeRule(): string
    {
        return 'regex:' . self::PRODUCT_CODE;
    }

    /**
     * Lấy Laravel validation rule cho mã giảm giá
     */
    public static function couponCodeRule(): string
    {
        return 'regex:' . self::COUPON_CODE;
    }

    /**
     * Lấy Laravel validation rule cho tên tiếng Việt
     */
    public static function nameVnRule(): string
    {
        return 'regex:' . self::NAME_VN;
    }

    /**
     * Validate số điện thoại
     */
    public static function validatePhone(?string $phone): bool
    {
        if (!$phone) return false;

        // Loại bỏ khoảng trắng và gạch ngang
        $phone = preg_replace('/[\s-]/', '', $phone);

        return (bool) preg_match(self::PHONE_VN, $phone);
    }

    /**
     * Validate email
     */
    public static function validateEmail(?string $email): bool
    {
        if (!$email) return false;
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    /**
     * Làm sạch số điện thoại (xóa khoảng trắng và gạch ngang)
     */
    public static function sanitizePhone(?string $phone): ?string
    {
        if (!$phone) return null;
        return preg_replace('/[\s-]/', '', $phone);
    }

    /**
     * Format số điện thoại để hiển thị
     * Input: 0912345678
     * Output: 091 234 5678
     */
    public static function formatPhone(?string $phone): ?string
    {
        if (!$phone) return null;

        $phone = self::sanitizePhone($phone);

        if (strlen($phone) === 10) {
            return substr($phone, 0, 3) . ' ' . substr($phone, 3, 3) . ' ' . substr($phone, 6);
        }

        if (strlen($phone) === 11) {
            return substr($phone, 0, 3) . ' ' . substr($phone, 3, 4) . ' ' . substr($phone, 7);
        }

        return $phone;
    }

    /**
     * Validate format giá
     */
    public static function validatePrice($price): bool
    {
        if (is_numeric($price) && $price >= 0) {
            return true;
        }
        return false;
    }

    /**
     * Validate số lượng (số nguyên dương)
     */
    public static function validateQuantity($quantity): bool
    {
        return is_int($quantity) && $quantity > 0;
    }
}
