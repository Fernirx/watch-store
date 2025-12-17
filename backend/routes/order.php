<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

// Route tạo order không cần auth (hỗ trợ guest checkout)
Route::post('/orders', [OrderController::class, 'store']);

Route::middleware('auth:api')->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);
});
?>