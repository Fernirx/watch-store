<?php

use App\Http\Controllers\CouponController;
use Illuminate\Support\Facades\Route;

// Public coupon validation (accessible to both auth and guest)
Route::middleware(['auth.optional'])->group(function () {
    Route::post('/coupons/validate', [CouponController::class, 'validate']);
});
