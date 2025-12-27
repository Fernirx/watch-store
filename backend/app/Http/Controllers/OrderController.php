<?php

namespace App\Http\Controllers;

use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Lấy danh sách đơn hàng
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $isAdmin = $user->role === 'ADMIN';

            $orders = $this->orderService->getOrders($user->id, $isAdmin);

            return response()->json([
                'success' => true,
                'data' => $orders,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch orders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy chi tiết đơn hàng
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            $isAdmin = $user->role === 'ADMIN';

            $order = $this->orderService->getOrderById((int)$id, $user->id, $isAdmin);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $order,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }
    }

    /**
     * Tạo đơn hàng mới (hỗ trợ cả user và guest)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'customer_name' => 'required|string|max:255', // Tên khách hàng (bắt buộc)
                'customer_email' => 'required|email|max:255', // Email (bắt buộc)
                'shipping_address' => 'required|string',
                'shipping_phone' => 'required|string',
                'payment_method' => 'required|in:cod,bank_transfer,vnpay',
                'notes' => 'nullable|string',
                'coupon_code' => 'nullable|string|max:50', // Mã giảm giá (optional)
                'guest_token' => 'nullable|string|size:64', // Cho guest checkout
            ]);

            // Lấy user_id nếu đã đăng nhập, nếu không lấy guest_token
            $userId = $request->user() ? $request->user()->id : null;
            $guestToken = $request->input('guest_token') ?? $request->header('X-Guest-Token');

            if (!$userId && !$guestToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Either user authentication or guest_token is required',
                ], 401);
            }

            $order = $this->orderService->createOrder($userId, $validated, $guestToken);

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order,
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
     * Cập nhật trạng thái đơn hàng (Admin)
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
            ]);

            $order = $this->orderService->updateOrderStatus((int)$id, $validated['status']);

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'data' => $order,
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
                'message' => 'Failed to update order status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Hủy đơn hàng
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        try {
            $order = $this->orderService->cancelOrder((int)$id, $request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully',
                'data' => $order,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 400);
        }
    }
}
