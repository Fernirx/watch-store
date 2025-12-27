<?php

use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

// Customer notification routes (no auth required - public)
Route::get('/notifications', [NotificationController::class, 'indexForCustomers']);
Route::get('/notifications/{id}', [NotificationController::class, 'show']);
