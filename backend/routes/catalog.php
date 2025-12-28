<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\GuestOtpController;
use Illuminate\Support\Facades\Route;

// Catalog routes
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{id}', [BrandController::class, 'show']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Guest Checkout OTP routes
Route::post('/guest/checkout/send-otp', [GuestOtpController::class, 'sendCheckoutOtp']);
Route::post('/guest/checkout/verify-otp', [GuestOtpController::class, 'verifyCheckoutOtp']);
Route::post('/guest/checkout/resend-otp', [GuestOtpController::class, 'resendCheckoutOtp']);
