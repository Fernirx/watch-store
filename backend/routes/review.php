<?php

use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;

// Public routes - Xem reviews (không cần auth)
Route::get('/products/{productId}/reviews', [ReviewController::class, 'getProductReviews']);

// Optional auth routes - Cho phép cả guest và user đã login
Route::middleware(['auth.optional'])->group(function () {
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::post('/reviews/can-review', [ReviewController::class, 'canReview']);
});
