<?php

namespace App\Services;

use App\Mail\OTPMail;
use App\Models\Otp;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Facades\Socialite;

class AuthService
{
    /**
     * Đăng nhập với email và password
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw new \Exception('Invalid credentials');
        }

        // Xóa token cũ và tạo token mới
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Đăng ký tài khoản mới
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Đăng xuất
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Refresh token
     */
    public function refreshToken(User $user): array
    {
        $user->currentAccessToken()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Gửi OTP đăng ký
     */
    public function sendRegisterOtp(array $data): void
    {
        // Xóa OTP cũ chưa sử dụng
        Otp::where('email', $data['email'])
            ->where('type', 'REGISTER')
            ->where('is_used', false)
            ->delete();

        // Tạo OTP mới
        $otpRecord = Otp::create([
            'email' => $data['email'],
            'name' => $data['name'],
            'password' => Hash::make($data['password']),
            'otp' => Otp::generateOtp(),
            'type' => 'REGISTER',
            'expires_at' => now()->addMinutes(5),
        ]);

        // Gửi email
        Mail::to($data['email'])->send(new OtpMail($otpRecord->otp, 'REGISTER'));
    }

    /**
     * Xác thực OTP đăng ký
     */
    public function verifyRegisterOtp(string $email, string $otp): array
    {
        $otpRecord = Otp::where('email', $email)
            ->where('otp', $otp)
            ->where('type', 'REGISTER')
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otpRecord) {
            throw new \Exception('Invalid or expired OTP');
        }

        // Tạo user mới
        $user = User::create([
            'name' => $otpRecord->name,
            'email' => $otpRecord->email,
            'password' => $otpRecord->password, // Already hashed
            'email_verified_at' => now(),
        ]);

        // Đánh dấu OTP đã sử dụng
        $otpRecord->update(['is_used' => true]);

        // Tạo token
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Gửi OTP quên mật khẩu
     */
    public function sendForgotPasswordOtp(string $email): void
    {
        $otpRecord = Otp::createOtp($email, 'FORGOT_PASSWORD');
        Mail::to($email)->send(new OtpMail($otpRecord->otp, 'FORGOT_PASSWORD'));
    }

    /**
     * Reset mật khẩu
     */
    public function resetPassword(string $email, string $otp, string $newPassword): void
    {
        if (!Otp::verifyOtp($email, $otp, 'FORGOT_PASSWORD')) {
            throw new \Exception('Invalid or expired OTP');
        }

        $user = User::where('email', $email)->first();
        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        // Xóa tất cả token cũ
        $user->tokens()->delete();
    }

    /**
     * Đăng nhập bằng Google
     */
    public function handleGoogleCallback(): array
    {
        $guzzleClient = new \GuzzleHttp\Client([
            'verify' => false,
        ]);

        $googleUser = Socialite::driver('google')
            ->setHttpClient($guzzleClient)
            ->stateless()
            ->user();

        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            // Tạo user mới
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'avatar_url' => $googleUser->getAvatar(),
                'provider' => 'GOOGLE',
                'provider_id' => $googleUser->getId(),
                'email_verified_at' => now(),
            ]);
        } else {
            // Cập nhật thông tin Google nếu chưa có
            if (!$user->provider_id) {
                $user->update([
                    'provider' => 'GOOGLE',
                    'provider_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                ]);
            }
        }

        // Xóa token cũ và tạo token mới
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
