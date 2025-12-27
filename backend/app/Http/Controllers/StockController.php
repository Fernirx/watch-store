<?php

namespace App\Http\Controllers;

use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class StockController extends Controller
{
    protected $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Import stock
     */
    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
        ]);

        try {
            $result = $this->stockService->importStock(
                $validated['items'],
                Auth::id(),
                $validated['notes'] ?? null
            );

            return response()->json($result, 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to import stock: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Export stock
     */
    public function export(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'reference_type' => 'nullable|string',
            'reference_id' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        try {
            $result = $this->stockService->exportStock(
                $validated['items'],
                Auth::id(),
                $validated['reference_type'] ?? 'MANUAL',
                $validated['reference_id'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json($result, 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export stock: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get low stock products
     */
    public function lowStock(): JsonResponse
    {
        $products = $this->stockService->getLowStockProducts();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Get stock report
     */
    public function report(Request $request): JsonResponse
    {
        $filters = $request->only(['category_id', 'brand_id', 'supplier_id', 'low_stock']);
        $products = $this->stockService->getStockReport($filters);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Get transaction history
     */
    public function transactions(Request $request): JsonResponse
    {
        $filters = $request->only(['product_id', 'type', 'supplier_id', 'from_date', 'to_date', 'per_page']);
        $transactions = $this->stockService->getTransactionHistory($filters);

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }
}
