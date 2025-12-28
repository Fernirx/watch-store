<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Profile routes - chỉ cho user đã đăng nhập
Route::middleware('auth:api')->group(function () {
    // Profile endpoints (bao gồm cả shipping address)
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);
    Route::put('/profile/change-password', [ProfileController::class, 'changePassword']);
});