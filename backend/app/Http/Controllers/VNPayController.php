<?php

namespace App\Http\Controllers;

use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class VNPayController extends Controller
{
    protected PaymentService $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Tạo payment URL VNPay
     */
    public function createPayment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|exists:orders,id',
            ]);

            $result = $this->paymentService->createVNPayPayment(
                $validated['order_id'],
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'payment_url' => $result['payment_url'],
                'payment_id' => $result['payment_id'],
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi xác thực',
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
     * Xử lý return từ VNPay
     */
    public function vnpayReturn(Request $request)
    {
        try {
            $responseData = $request->all();

            $result = $this->paymentService->processVNPayReturn($responseData);

            $frontendUrl = config('app.frontend_url');

            if ($result['success']) {
                return redirect($frontendUrl . '/payment/success?order_id=' . $result['order_id']);
            } else {
                return redirect($frontendUrl . '/payment/failed?order_id=' . $result['order_id'] . '&code=' . $result['code']);
            }
        } catch (\Exception $e) {
            \Log::error('❌ VNPay return exception: ' . $e->getMessage());

            // Nếu có lỗi xử lý, cố gắng restore cart nếu có order_id
            try {
                $responseData = $request->all();
                if (isset($responseData['vnp_TxnRef'])) {
                    $orderId = explode('_', $responseData['vnp_TxnRef'])[0];
                    $order = \App\Models\Order::find($orderId);

                    if ($order) {
                        \Log::info('🔄 Attempting to restore cart from order due to exception');
                        app(\App\Services\OrderService::class)->restoreCartFromOrder($order);

                        // Hoàn lại stock nếu order chưa bị cancel
                        if ($order->status !== 'CANCELLED') {
                            foreach ($order->items as $item) {
                                $item->product->increment('stock_quantity', $item->quantity);
                            }
                            $order->update(['status' => 'CANCELLED', 'payment_status' => 'failed']);
                        }
                    }
                }
            } catch (\Exception $restoreError) {
                \Log::error('⚠️ Failed to restore cart on exception: ' . $restoreError->getMessage());
            }

            $frontendUrl = config('app.frontend_url');

            $errorParam = match ($e->getMessage()) {
                'Chữ ký không hợp lệ' => 'invalid_signature',
                'Không tìm thấy đơn hàng' => 'order_not_found',
                'Lỗi xử lý' => 'processing_error',
                default => 'system_error',
            };

            return redirect($frontendUrl . '/payment/failed?error=' . $errorParam);
        }
    }

    /**
     * Xử lý IPN từ VNPay
     */
    public function vnpayIPN(Request $request): JsonResponse
    {
        try {
            $responseData = $request->all();

            $result = $this->paymentService->processVNPayIPN($responseData);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'RspCode' => '99',
                'Message' => 'Lỗi hệ thống'
            ]);
        }
    }
}
