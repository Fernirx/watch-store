<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Register flow (3 bước: email → OTP → name+password)
Route::post('/register', [AuthController::class, 'sendRegisterOtp']); // Bước 1: Gửi OTP
Route::post('/register/resend-otp', [AuthController::class, 'resendRegisterOtp']); // Gửi lại OTP
Route::post('/register/verify', [AuthController::class, 'verifyRegisterOtp']); // Bước 2: Verify OTP
Route::post('/register/complete', [AuthController::class, 'completeRegistration']); // Bước 3: Hoàn tất đăng ký

// Forgot password flow
Route::post('/forgot-password/send-otp', [AuthController::class, 'sendForgotPasswordOtp']);
Route::post('/forgot-password/resend-otp', [AuthController::class, 'resendForgotPasswordOtp']);
Route::post('/forgot-password/reset', [AuthController::class, 'resetPassword']);

// Google OAuth routes - cần session middleware
Route::middleware(['web'])->group(function () {
    Route::get('/auth/google', [AuthController::class, 'googleRedirect']);
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);
});

// Refresh token - không cần auth vì dùng khi token hết hạn
Route::post('/refresh', [AuthController::class, 'refresh']);

// Protected routes - JWT auth
Route::middleware(['auth:api', 'account.active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', fn (\Illuminate\Http\Request $request) => $request->user());
});
