<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

// Route tạo order - cho phép cả user và guest
// Middleware check token nếu có trong header (không throw error nếu không có)
Route::post('/orders', [OrderController::class, 'store'])->middleware('auth.optional');

Route::middleware(['auth:api', 'account.active'])->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);
});
?>