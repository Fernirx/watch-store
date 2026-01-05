<?php

namespace App\Http\Controllers;

use App\Services\OrderService;
use App\Services\GuestOtpService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    protected OrderService $orderService;
    protected GuestOtpService $guestOtpService;

    public function __construct(OrderService $orderService, GuestOtpService $guestOtpService)
    {
        $this->orderService = $orderService;
        $this->guestOtpService = $guestOtpService;
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
                'shipping_address' => 'required|string|min:10',
                'shipping_phone' => [
                    'required',
                    'string',
                    'max:15',
                    'regex:/^(0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/'
                ],
                'payment_method' => 'required|in:cod,vnpay',
                'notes' => 'nullable|string',
                'coupon_code' => 'nullable|string|max:50', // Mã giảm giá (optional)
                'guest_token' => 'nullable|string|size:64', // Cho guest checkout
                'selected_item_ids' => 'nullable|array', // Danh sách cart item IDs được chọn
                'selected_item_ids.*' => 'integer|min:1', // Mỗi ID phải là số nguyên dương
            ], [
                'shipping_phone.regex' => 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0912345678)',
                'shipping_address.min' => 'Địa chỉ phải có ít nhất 10 ký tự',
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

            // Kiểm tra OTP verification cho GUEST checkout (chỉ guest, không áp dụng cho user đã đăng nhập)
            if (!$userId && $guestToken) {
                $isVerified = $this->guestOtpService->isEmailVerified(
                    $validated['customer_email'],
                    $guestToken
                );

                if (!$isVerified) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email chưa được xác thực. Vui lòng xác thực email trước khi đặt hàng.',
                        'error_code' => 'EMAIL_NOT_VERIFIED',
                    ], 403);
                }
            }

            // Lấy selected_item_ids nếu có
            $selectedItemIds = $validated['selected_item_ids'] ?? null;

            $order = $this->orderService->createOrder($userId, $validated, $guestToken, $selectedItemIds);

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
                'status' => 'required|in:PENDING,PROCESSING,COMPLETED,CANCELLED',
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
     * Cập nhật trạng thái thanh toán (Admin - dành cho COD)
     */
    public function updatePaymentStatus(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_status' => 'required|in:pending,paid,failed',
            ]);

            $order = $this->orderService->updatePaymentStatus((int)$id, $validated['payment_status']);

            return response()->json([
                'success' => true,
                'message' => 'Payment status updated successfully',
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
                'message' => 'Failed to update payment status',
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
