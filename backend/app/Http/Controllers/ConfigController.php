<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    /**
     * Lấy phí ship
     */
    public function getShippingFee(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'shipping_fee' => (int) env('SHIPPING_FEE', 30000),
            ],
        ], 200);
    }
}
