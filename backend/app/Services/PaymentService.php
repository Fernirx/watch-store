<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderService;
use App\Helpers\BusinessValidator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    protected VNPayService $vnpayService;
    protected OrderService $orderService;

    public function __construct(VNPayService $vnpayService, OrderService $orderService)
    {
        $this->vnpayService = $vnpayService;
        $this->orderService = $orderService;
    }

    /**
     * Tạo payment VNPay cho đơn hàng
     */
    public function createVNPayPayment(int $orderId, string $ipAddr): array
    {
        $order = Order::findOrFail($orderId);

        // Kiểm tra order đã thanh toán chưa
        if ($order->payment_status === 'paid') {
            throw new \Exception('Đơn hàng đã được thanh toán');
        }

        // Tạo payment record
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'vnpay',
            'amount' => $order->total,
            'status' => 'PENDING',
        ]);

        // Tạo URL thanh toán VNPay (Tiếng Việt không dấu theo yêu cầu VNPay)
        $orderInfo = "Thanh toan don hang " . $order->order_number;

        $paymentUrl = $this->vnpayService->createPaymentUrl(
            $order->id,
            $order->total,
            $orderInfo,
            $ipAddr
        );

        return [
            'payment_url' => $paymentUrl,
            'payment_id' => $payment->id,
        ];
    }

    /**
     * Xử lý response từ VNPay
     */
    public function processVNPayReturn(array $responseData): array
    {
        // Validate checksum
        if (!$this->vnpayService->validateResponse($responseData)) {
            throw new \Exception('Invalid signature');
        }

        $vnpTxnRef = $responseData['vnp_TxnRef'];
        $vnpResponseCode = $responseData['vnp_ResponseCode'];
        $vnpTransactionNo = $responseData['vnp_TransactionNo'] ?? null;
        $vnpAmount = $responseData['vnp_Amount'] / 100; // Chia 100 để trả về số tiền thực

        // Lấy order_id từ vnp_TxnRef (format: order_id_timestamp)
        $orderId = explode('_', $vnpTxnRef)[0];
        $order = Order::find($orderId);

        if (!$order) {
            throw new \Exception('Order not found');
        }

        // CRITICAL VALIDATION: So sánh số tiền thanh toán với tổng đơn hàng
        if ($vnpAmount != $order->total) {
            Log::error('🚨 VNPay amount mismatch detected!', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'order_total' => $order->total,
                'vnpay_amount' => $vnpAmount,
                'difference' => $order->total - $vnpAmount,
            ]);

            BusinessValidator::alert('PAYMENT_AMOUNT_MISMATCH', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'expected_amount' => $order->total,
                'received_amount' => $vnpAmount,
                'vnp_txn_ref' => $vnpTxnRef,
            ]);

            throw new \Exception('Payment amount does not match order total');
        }

        DB::beginTransaction();
        try {
            // Cập nhật payment
            $payment = Payment::where('order_id', $order->id)
                ->where('payment_method', 'vnpay')
                ->latest()
                ->first();

            if ($payment) {
                $payment->update([
                    'transaction_id' => $vnpTransactionNo,
                    'status' => $vnpResponseCode === '00' ? 'SUCCESS' : 'FAILED',
                    'response_code' => $vnpResponseCode,
                    'response_message' => $this->vnpayService->getResponseMessage($vnpResponseCode),
                ]);
            }

            // Nếu thanh toán thành công, cập nhật order
            if ($vnpResponseCode === '00') {
                $order->update([
                    'payment_status' => 'paid',
                    'payment_method' => 'vnpay',
                ]);

                // Xóa giỏ hàng sau khi thanh toán thành công
                $cart = \App\Models\Cart::where('user_id', $order->user_id)
                    ->orWhere('guest_token', $order->guest_token)
                    ->first();

                if ($cart) {
                    $cart->items()->delete();
                    Log::info("🗑️ Cart cleared after successful VNPay payment for order #{$order->order_number}");
                }

                DB::commit();

                return [
                    'success' => true,
                    'order_id' => $order->id,
                ];
            } else {
                // Payment failed - restore stock
                Log::warning("⚠️ Payment failed for order #{$order->order_number}, code: {$vnpResponseCode}");

                // Hoàn lại tồn kho
                foreach ($order->items as $item) {
                    $item->product->increment('stock_quantity', $item->quantity);
                }

                // KHÔNG cần restore cart vì cart vẫn còn (chưa bị xóa với VNPay)
                // Cart items đã được giữ nguyên khi tạo order
                Log::info("ℹ️ Cart items already preserved, no need to restore");

                // Cập nhật trạng thái order
                $order->update([
                    'status' => 'CANCELLED',
                    'payment_status' => 'failed',
                ]);

                DB::commit();

                return [
                    'success' => false,
                    'order_id' => $order->id,
                    'code' => $vnpResponseCode,
                ];
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('VNPay return processing error: ' . $e->getMessage());
            throw new \Exception('Processing error');
        }
    }

    /**
     * Xử lý IPN từ VNPay
     */
    public function processVNPayIPN(array $responseData): array
    {
        // Validate checksum
        if (!$this->vnpayService->validateResponse($responseData)) {
            return [
                'RspCode' => '97',
                'Message' => 'Invalid Signature'
            ];
        }

        $vnpTxnRef = $responseData['vnp_TxnRef'];
        $vnpResponseCode = $responseData['vnp_ResponseCode'];
        $vnpTransactionNo = $responseData['vnp_TransactionNo'] ?? null;
        $vnpAmount = $responseData['vnp_Amount'] / 100;

        // Lấy order_id từ vnp_TxnRef
        $orderId = explode('_', $vnpTxnRef)[0];
        $order = Order::find($orderId);

        if (!$order) {
            return [
                'RspCode' => '01',
                'Message' => 'Order not found'
            ];
        }

        // CRITICAL VALIDATION: So sánh số tiền thanh toán với tổng đơn hàng (IPN)
        if ($vnpAmount != $order->total) {
            Log::error('🚨 VNPay IPN amount mismatch detected!', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'order_total' => $order->total,
                'vnpay_amount' => $vnpAmount,
                'difference' => $order->total - $vnpAmount,
            ]);

            BusinessValidator::alert('PAYMENT_AMOUNT_MISMATCH_IPN', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'expected_amount' => $order->total,
                'received_amount' => $vnpAmount,
                'vnp_txn_ref' => $vnpTxnRef,
            ]);

            return [
                'RspCode' => '04',
                'Message' => 'Invalid Amount'
            ];
        }

        // Kiểm tra order đã được xử lý chưa
        if ($order->payment_status === 'paid') {
            return [
                'RspCode' => '02',
                'Message' => 'Order already confirmed'
            ];
        }

        DB::beginTransaction();
        try {
            // Cập nhật payment
            $payment = Payment::where('order_id', $order->id)
                ->where('payment_method', 'vnpay')
                ->latest()
                ->first();

            if ($payment) {
                $payment->update([
                    'transaction_id' => $vnpTransactionNo,
                    'status' => $vnpResponseCode === '00' ? 'SUCCESS' : 'FAILED',
                    'response_code' => $vnpResponseCode,
                    'response_message' => $this->vnpayService->getResponseMessage($vnpResponseCode),
                ]);
            }

            // Nếu thanh toán thành công, cập nhật order
            if ($vnpResponseCode === '00') {
                $order->update([
                    'payment_status' => 'paid',
                    'payment_method' => 'vnpay',
                ]);
            }

            DB::commit();

            return [
                'RspCode' => '00',
                'Message' => 'Confirm Success'
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('VNPay IPN processing error: ' . $e->getMessage());
            return [
                'RspCode' => '99',
                'Message' => 'Unknown error'
            ];
        }
    }
}
