<?php

namespace App\Services;

use App\Mail\OTPMail;
use App\Models\Customer;
use App\Models\Otp;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Facades\Socialite;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    /**
     * Đăng nhập với email và password
     */
    public function login(string $email, string $password, $request = null): array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw new \Exception('Invalid credentials');
        }

        // CRITICAL: Check if account is active
        if (!$user->is_active) {
            throw new \Exception('Your account has been deactivated. Please contact support for assistance.');
        }

        // Merge guest cart if guest_token provided
        if ($request && $request->filled('guest_token')) {
            \Log::info('🔑 Guest token received: ' . $request->input('guest_token') . ' for user: ' . $user->id);
            $cartService = app(CartService::class);
            $cartService->mergeGuestCartToUser($request->input('guest_token'), $user->id);
            \Log::info('✅ Cart merge completed for user: ' . $user->id);
        } else {
            \Log::info('⚠️ No guest token provided for user: ' . $user->id);
        }

        // Tạo access token (JWT)
        $accessToken = auth('api')->login($user);

        // Tạo refresh token
        $refreshToken = $this->createRefreshToken($user, $request);

        return [
            'user' => $user,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->token,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60, // Convert minutes to seconds
        ];
    }

    /**
     * Đăng ký tài khoản mới (phương thức cũ, không dùng nữa)
     */
    public function register(array $data): array
    {
        $user = User::create([
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Tạo customer profile
        Customer::create([
            'user_id' => $user->id,
            'name' => $data['name'],
        ]);

        $accessToken = auth('api')->login($user);
        $refreshToken = $this->createRefreshToken($user);

        return [
            'user' => $user,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->token,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    /**
     * Đăng xuất
     */
    public function logout(User $user): void
    {
        // Xóa tất cả refresh tokens của user
        RefreshToken::where('user_id', $user->id)->delete();

        // Invalidate JWT token (add to blacklist)
        auth('api')->logout();
    }

    /**
     * Refresh access token bằng refresh token
     */
    public function refreshToken(string $refreshTokenString, $request = null): array
    {
        $refreshToken = RefreshToken::where('token', $refreshTokenString)->first();

        if (!$refreshToken || $refreshToken->isExpired()) {
            throw new \Exception('Invalid or expired refresh token');
        }

        $user = $refreshToken->user;

        // CRITICAL: Check if account is active
        if (!$user->is_active) {
            // Xóa refresh token để user không thể refresh nữa
            $refreshToken->delete();
            throw new \Exception('Your account has been deactivated. Please contact support for assistance.');
        }

        // Xóa refresh token cũ
        $refreshToken->delete();

        // Tạo access token mới
        $accessToken = auth('api')->login($user);

        // Tạo refresh token mới
        $newRefreshToken = $this->createRefreshToken($user, $request);

        return [
            'user' => $user,
            'access_token' => $accessToken,
            'refresh_token' => $newRefreshToken->token,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    /**
     * Tạo refresh token mới
     */
    private function createRefreshToken(User $user, $request = null): RefreshToken
    {
        // Xóa các refresh token cũ đã hết hạn
        RefreshToken::where('user_id', $user->id)
            ->where('expires_at', '<', now())
            ->delete();

        // Giới hạn số lượng refresh token (tối đa 5 thiết bị)
        $existingTokens = RefreshToken::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($existingTokens->count() >= 5) {
            // Xóa token cũ nhất
            $existingTokens->last()->delete();
        }

        return RefreshToken::create([
            'user_id' => $user->id,
            'token' => RefreshToken::generateToken(),
            'expires_at' => now()->addDays(30), // 30 ngày
            'ip_address' => $request ? $request->ip() : null,
            'user_agent' => $request ? $request->userAgent() : null,
        ]);
    }

    /**
     * Gửi OTP đăng ký (Bước 1: Chỉ cần email)
     */
    public function sendRegisterOtp(string $email): void
    {
        // Kiểm tra email đã tồn tại chưa
        if (User::where('email', $email)->exists()) {
            throw new \Exception('Email đã được đăng ký');
        }

        // Tạo OTP mới (hàm createOtp tự động xóa OTP cũ)
        $otpRecord = Otp::createOtp($email, 'REGISTER');

        // Gửi email
        Mail::to($email)->send(new OtpMail($otpRecord->otp, 'REGISTER'));
    }

    /**
     * Xác thực OTP đăng ký (Bước 2: Verify OTP)
     */
    public function verifyRegisterOtp(string $email, string $otp): array
    {
        $result = Otp::verifyOtp($email, $otp, 'REGISTER');

        if (!$result['success']) {
            throw new \Exception($result['message']);
        }

        return [
            'success' => true,
            'message' => 'Xác thực OTP thành công. Vui lòng hoàn tất đăng ký',
            'email' => $email,
        ];
    }

    /**
     * Hoàn tất đăng ký (Bước 3: Tạo User)
     */
    public function completeRegistration(string $email, string $name, string $password, $request = null): array
    {
        // Kiểm tra email đã verify OTP chưa
        $verifiedOtp = Otp::where('email', $email)
            ->where('type', 'REGISTER')
            ->where('is_used', true)
            ->whereNotNull('verified_at')
            ->where('verified_at', '>', now()->subMinutes(15)) // OTP verify trong 15 phút
            ->orderBy('verified_at', 'desc')
            ->first();

        if (!$verifiedOtp) {
            throw new \Exception('OTP chưa được xác thực hoặc đã hết hạn. Vui lòng gửi lại OTP');
        }

        // Kiểm tra email đã tồn tại chưa
        if (User::where('email', $email)->exists()) {
            throw new \Exception('Email đã được đăng ký');
        }

        // Tạo user mới (chỉ auth info)
        $user = User::create([
            'email' => $email,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        // Tạo customer profile
        Customer::create([
            'user_id' => $user->id,
            'name' => $name,
        ]);

        // Merge guest cart if guest_token provided
        if ($request && $request->filled('guest_token')) {
            \Log::info('🔑 Guest token received: ' . $request->input('guest_token') . ' for user: ' . $user->id);
            $cartService = app(CartService::class);
            $cartService->mergeGuestCartToUser($request->input('guest_token'), $user->id);
            \Log::info('✅ Cart merge completed for user: ' . $user->id);
        }

        // Tạo tokens
        $accessToken = auth('api')->login($user);
        $refreshToken = $this->createRefreshToken($user, $request);

        return [
            'user' => $user,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->token,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl') * 60,
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
        $user = User::where('email', $email)->first();
        if (Hash::check($newPassword, $user->password)) {
            throw new \Exception('Mật khẩu mới không được trùng với mật khẩu cũ');
        }

        $result = Otp::verifyOtp($email, $otp, 'FORGOT_PASSWORD');
        if (!$result['success']) {
            throw new \Exception($result['message']);
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        // Xóa tất cả refresh tokens (logout all devices)
        RefreshToken::where('user_id', $user->id)->delete();
    }

    /**
     * Gửi lại OTP đăng ký
     */
    public function resendRegisterOtp(string $email): void
    {
        // Gọi lại sendRegisterOtp để tạo OTP mới (đơn giản hơn)
        $this->sendRegisterOtp($email);
    }

    /**
     * Gửi lại OTP quên mật khẩu
     */
    public function resendForgotPasswordOtp(string $email): void
    {
        // Gọi lại sendForgotPasswordOtp để tạo OTP mới
        $this->sendForgotPasswordOtp($email);
    }

    /**
     * Đăng nhập bằng Google
     */
    public function handleGoogleCallback($request = null): array
    {
        // CRITICAL FIX: Removed 'verify' => false to enable SSL verification
        // This prevents Man-in-the-Middle attacks on OAuth flow

        $googleUser = Socialite::driver('google')
            ->stateless()
            ->user();

        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            // Tạo user mới
            $user = User::create([
                'email' => $googleUser->getEmail(),
                'avatar_url' => $googleUser->getAvatar(),
                'provider' => 'GOOGLE',
                'provider_id' => $googleUser->getId(),
                'email_verified_at' => now(),
            ]);

            // Tạo customer profile
            Customer::create([
                'user_id' => $user->id,
                'name' => $googleUser->getName(),
            ]);
        } else {
            // CRITICAL: Check if account is active
            if (!$user->is_active) {
                throw new \Exception('Your account has been deactivated. Please contact support for assistance.');
            }

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

        // Merge guest cart if guest_token provided
        if ($request && $request->filled('guest_token')) {
            \Log::info('🔑 Guest token received: ' . $request->input('guest_token') . ' for user: ' . $user->id);
            $cartService = app(CartService::class);
            $cartService->mergeGuestCartToUser($request->input('guest_token'), $user->id);
            \Log::info('✅ Cart merge completed for user: ' . $user->id);
        } else {
            \Log::info('⚠️ No guest token provided for user: ' . $user->id);
        }

        // Tạo tokens
        $accessToken = auth('api')->login($user);
        $refreshToken = $this->createRefreshToken($user, $request);

        return [
            'user' => $user,
            'token' => $accessToken,
            'refresh_token' => $refreshToken->token,
        ];
    }

    /**
     * Get current user from JWT token
     */
    public function getCurrentUser(): User
    {
        return auth('api')->user();
    }
}
