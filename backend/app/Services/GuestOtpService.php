<?php

namespace App\Services;

use App\Mail\OTPMail;
use App\Models\Otp;
use Illuminate\Support\Facades\Mail;

/**
 * Guest Checkout OTP Service
 *
 * Xử lý xác thực email cho guest checkout
 */
class GuestOtpService
{
    /**
     * Gửi OTP cho guest checkout
     */
    public function sendCheckoutOtp(string $email, string $guestToken): array
    {
        // Xóa OTP cũ của guest này (theo email và guest_token)
        Otp::where('email', $email)
            ->where('type', 'GUEST_CHECKOUT')
            ->where('guest_token', $guestToken)
            ->where('is_used', false)
            ->delete();

        // Tạo OTP mới
        $otpRecord = Otp::create([
            'email' => $email,
            'otp' => Otp::generateOtp(),
            'type' => 'GUEST_CHECKOUT',
            'guest_token' => $guestToken,
            'expires_at' => now()->addMinutes(10), // OTP checkout hết hạn sau 10 phút
        ]);

        // Gửi email
        Mail::to($email)->send(new OTPMail($otpRecord->otp, 'GUEST_CHECKOUT'));

        return [
            'success' => true,
            'message' => 'OTP đã được gửi đến email của bạn. Có hiệu lực trong 10 phút.',
            'expires_at' => $otpRecord->expires_at->toISOString(),
        ];
    }

    /**
     * Verify OTP cho guest checkout
     */
    public function verifyCheckoutOtp(string $email, string $otp, string $guestToken): array
    {
        // Verify OTP
        $result = Otp::verifyOtp($email, $otp, 'GUEST_CHECKOUT');

        if (!$result['success']) {
            return $result;
        }

        // Kiểm tra guest_token có khớp không (bảo mật)
        $otpRecord = $result['otp_record'];
        if ($otpRecord->guest_token !== $guestToken) {
            return [
                'success' => false,
                'message' => 'Guest token không hợp lệ',
                'otp_record' => null,
            ];
        }

        return [
            'success' => true,
            'message' => 'Xác thực email thành công. Bạn có thể tiếp tục thanh toán.',
            'email' => $email,
            'guest_token' => $guestToken,
            'verified_at' => $otpRecord->verified_at->toISOString(),
        ];
    }

    /**
     * Kiểm tra email đã được verify chưa (dùng khi tạo order)
     */
    public function isEmailVerified(string $email, string $guestToken): bool
    {
        $verifiedOtp = Otp::where('email', $email)
            ->where('type', 'GUEST_CHECKOUT')
            ->where('guest_token', $guestToken)
            ->where('is_used', true)
            ->whereNotNull('verified_at')
            ->where('verified_at', '>', now()->subMinutes(15)) // OTP verify còn hiệu lực 15 phút
            ->exists();

        return $verifiedOtp;
    }

    /**
     * Gửi lại OTP
     */
    public function resendCheckoutOtp(string $email, string $guestToken): array
    {
        return $this->sendCheckoutOtp($email, $guestToken);
    }
}
