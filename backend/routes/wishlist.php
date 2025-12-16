<?php

use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/items', [WishlistController::class, 'store']);
    Route::delete('/wishlist/items/{id}', [WishlistController::class, 'destroy']);
    Route::delete('/wishlist/clear', [WishlistController::class, 'clear']);
    Route::post('/wishlist/items/{id}/move-to-cart', [WishlistController::class, 'moveToCart']);
    Route::get('/wishlist/check/{productId}', [WishlistController::class, 'check']);
});
