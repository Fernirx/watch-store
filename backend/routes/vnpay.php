<?php

use App\Http\Controllers\VNPayController;
use Illuminate\Support\Facades\Route;

// Route tạo payment URL (yêu cầu auth)
Route::middleware('auth:api')->group(function () {
    Route::post('/vnpay/create-payment', [VNPayController::class, 'createPayment']);
});

// Routes callback từ VNPay (không cần auth)
Route::get('/vnpay/return', [VNPayController::class, 'vnpayReturn']);
Route::post('/vnpay/ipn', [VNPayController::class, 'vnpayIPN']);
