<?php

namespace App\Http\Controllers;

use App\Services\WishlistService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class WishlistController extends Controller
{
    protected WishlistService $wishlistService;

    public function __construct(WishlistService $wishlistService)
    {
        $this->wishlistService = $wishlistService;
    }

    /**
     * Lấy wishlist của user
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $data = $this->wishlistService->getWishlist($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch wishlist',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Thêm product vào wishlist
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
            ]);

            $wishlistItem = $this->wishlistService->addToWishlist(
                $request->user()->id,
                $validated['product_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã thêm vào danh sách yêu thích',
                'data' => $wishlistItem,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Xóa item khỏi wishlist
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $this->wishlistService->removeFromWishlist($request->user()->id, (int)$id);

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa khỏi danh sách yêu thích',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove item',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa toàn bộ wishlist
     */
    public function clear(Request $request): JsonResponse
    {
        try {
            $this->wishlistService->clearWishlist($request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa toàn bộ danh sách yêu thích',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear wishlist',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Chuyển item từ wishlist sang cart
     */
    public function moveToCart(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'quantity' => 'sometimes|integer|min:1',
            ]);

            $cartItem = $this->wishlistService->moveToCart(
                $request->user()->id,
                (int)$id,
                $validated['quantity'] ?? 1
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã chuyển vào giỏ hàng',
                'data' => $cartItem,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check xem product có trong wishlist không
     */
    public function check(Request $request, string $productId): JsonResponse
    {
        try {
            $isInWishlist = $this->wishlistService->isInWishlist(
                $request->user()->id,
                (int)$productId
            );

            return response()->json([
                'success' => true,
                'data' => ['is_in_wishlist' => $isInWishlist],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check wishlist',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
