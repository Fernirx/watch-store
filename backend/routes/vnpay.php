<?php

use App\Http\Controllers\VNPayController;
use Illuminate\Support\Facades\Route;

// Route tạo payment URL (cho phép cả guest và user)
Route::post('/vnpay/create-payment', [VNPayController::class, 'createPayment'])->middleware('auth.optional');

// Routes callback từ VNPay (không cần auth)
Route::get('/vnpay/return', [VNPayController::class, 'vnpayReturn']);
Route::post('/vnpay/ipn', [VNPayController::class, 'vnpayIPN']);
