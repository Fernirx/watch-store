<?php

namespace App\Http\Controllers;

use App\Models\GuestSession;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class GuestCartController extends Controller
{
    protected CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    /**
     * Tạo guest session mới
     */
    public function createSession(): JsonResponse
    {
        try {
            $session = GuestSession::createSession();

            return response()->json([
                'success' => true,
                'data' => [
                    'guest_token' => $session->guest_token,
                    'expires_at' => $session->expires_at,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo phiên làm việc',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy giỏ hàng của guest
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $guestToken = $request->header('X-Guest-Token') ?? $request->get('guest_token');

            if (!$guestToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yêu cầu guest token',
                ], 400);
            }

            $cartData = $this->cartService->getGuestCart($guestToken);

            return response()->json([
                'success' => true,
                'data' => $cartData,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tải giỏ hàng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Thêm sản phẩm vào giỏ hàng guest
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $guestToken = $request->header('X-Guest-Token') ?? $request->get('guest_token');

            if (!$guestToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yêu cầu guest token',
                ], 400);
            }

            $validated = $request->validate([
                'product_id' => 'required|integer|exists:products,id',
                'quantity' => 'required|integer|min:1',
            ]);

            $cartItem = $this->cartService->addToGuestCart(
                $guestToken,
                $validated['product_id'],
                $validated['quantity']
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã thêm sản phẩm vào giỏ hàng',
                'data' => $cartItem,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi xác thực dữ liệu',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ guest
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $guestToken = $request->header('X-Guest-Token') ?? $request->get('guest_token');

            if (!$guestToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yêu cầu guest token',
                ], 400);
            }

            $validated = $request->validate([
                'quantity' => 'required|integer|min:1',
            ]);

            $cartItem = $this->cartService->updateGuestCartItem(
                $guestToken,
                $id,
                $validated['quantity']
            );

            return response()->json([
                'success' => true,
                'message' => 'Cart item updated',
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
                'message' => 'Không thể cập nhật giỏ hàng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa sản phẩm khỏi giỏ hàng guest
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $guestToken = $request->header('X-Guest-Token') ?? $request->get('guest_token');

            if (!$guestToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yêu cầu guest token',
                ], 400);
            }

            $this->cartService->removeFromGuestCart($guestToken, $id);

            return response()->json([
                'success' => true,
                'message' => 'Product removed from cart',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa sản phẩm',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa toàn bộ giỏ hàng guest
     */
    public function clear(Request $request): JsonResponse
    {
        try {
            $guestToken = $request->header('X-Guest-Token') ?? $request->get('guest_token');

            if (!$guestToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Yêu cầu guest token',
                ], 400);
            }

            $this->cartService->clearGuestCart($guestToken);

            return response()->json([
                'success' => true,
                'message' => 'Cart cleared',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa giỏ hàng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
