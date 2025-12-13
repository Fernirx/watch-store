<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Profile routes - chỉ cho user đã đăng nhập
Route::middleware('auth:sanctum')->group(function () {
    // Profile endpoints
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);
    Route::put('/profile/change-password', [ProfileController::class, 'changePassword']);

    // Address endpoints
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::get('/addresses/default', [AddressController::class, 'getDefault']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::put('/addresses/{id}/set-default', [AddressController::class, 'setDefault']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
});