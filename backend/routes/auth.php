<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'sendRegisterOtp']);
Route::post('/register/verify', [AuthController::class, 'verifyRegisterOtp']);
Route::post('/forgot-password/send-otp', [AuthController::class, 'sendForgotPasswordOtp']);
Route::post('/forgot-password/reset', [AuthController::class, 'resetPassword']);

// Google OAuth routes - cần session middleware
Route::middleware(['web'])->group(function () {
    Route::get('/auth/google', [AuthController::class, 'googleRedirect']);
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);
});

// Refresh token - không cần auth vì dùng khi token hết hạn
Route::post('/refresh', [AuthController::class, 'refresh']);

// Protected routes - JWT auth
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', fn (\Illuminate\Http\Request $request) => $request->user());
});
