<?php

namespace App\Services;

use App\Mail\OTPMail;
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

        // Merge guest cart if guest_token provided
        if ($request && $request->has('guest_token')) {
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
     * Đăng ký tài khoản mới
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
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
    public function verifyRegisterOtp(string $email, string $otp, $request = null): array
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

        // Merge guest cart if guest_token provided
        if ($request && $request->has('guest_token')) {
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
        if (!Otp::verifyOtp($email, $otp, 'FORGOT_PASSWORD')) {
            throw new \Exception('Invalid or expired OTP');
        }

        $user = User::where('email', $email)->first();
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
        // Tìm OTP record chưa sử dụng (bao gồm cả đã hết hạn)
        $existingOtp = Otp::where('email', $email)
            ->where('type', 'REGISTER')
            ->where('is_used', false)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$existingOtp) {
            throw new \Exception('No pending registration found for this email. Please register again.');
        }

        // Xóa tất cả OTP cũ của email này
        Otp::where('email', $email)
            ->where('type', 'REGISTER')
            ->where('is_used', false)
            ->delete();

        // Tạo OTP mới với cùng name và password từ OTP cũ
        $otpRecord = Otp::create([
            'email' => $email,
            'name' => $existingOtp->name,
            'password' => $existingOtp->password, // Already hashed
            'otp' => Otp::generateOtp(),
            'type' => 'REGISTER',
            'expires_at' => now()->addMinutes(5),
        ]);

        // Gửi email
        Mail::to($email)->send(new OtpMail($otpRecord->otp, 'REGISTER'));
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

        // Merge guest cart if guest_token provided
        if ($request && $request->has('guest_token')) {
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
