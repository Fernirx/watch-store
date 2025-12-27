<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CouponController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:api', 'role:ADMIN'])->group(function () {
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::post('/brands', [BrandController::class, 'store']);
    Route::put('/brands/{id}', [BrandController::class, 'update']);
    Route::delete('/brands/{id}', [BrandController::class, 'destroy']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // User Management Routes
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

    // Coupon Management Routes
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::get('/coupons/{id}', [CouponController::class, 'show']);
    Route::post('/coupons', [CouponController::class, 'store']);
    Route::put('/coupons/{id}', [CouponController::class, 'update']);
    Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
});
