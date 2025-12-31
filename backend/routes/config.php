<?php

use App\Http\Controllers\ConfigController;
use Illuminate\Support\Facades\Route;

/**
 * Public Config Routes
 */
Route::prefix('config')->group(function () {
    Route::get('/shipping-fee', [ConfigController::class, 'getShippingFee']);
});
