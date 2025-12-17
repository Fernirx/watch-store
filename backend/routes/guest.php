<?php

use App\Http\Controllers\GuestCartController;
use Illuminate\Support\Facades\Route;

// Guest session
Route::post('/guest/session', [GuestCartController::class, 'createSession']);

// Guest cart - không cần authentication
Route::get('/guest/cart', [GuestCartController::class, 'index']);
Route::post('/guest/cart/items', [GuestCartController::class, 'store']);
Route::put('/guest/cart/items/{id}', [GuestCartController::class, 'update']);
Route::delete('/guest/cart/items/{id}', [GuestCartController::class, 'destroy']);
Route::delete('/guest/cart/clear', [GuestCartController::class, 'clear']);
