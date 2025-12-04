<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\VNPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VNPayController extends Controller
{
    protected $vnpayService;

    public function __construct(VNPayService $vnpayService)
    {
        $this->vnpayService = $vnpayService;
    }

    public function createPayment(Request $request)
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|exists:orders,id',
            ]);

            $order = Order::findOrFail($validated['order_id']);

            // Kiểm tra order đã thanh toán chưa
            if ($order->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Đơn hàng đã được thanh toán',
                ], 400);
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
            $ipAddr = $request->ip();

            $paymentUrl = $this->vnpayService->createPaymentUrl(
                $order->id,
                $order->total,
                $orderInfo,
                $ipAddr
            );

            return response()->json([
                'success' => true,
                'payment_url' => $paymentUrl,
                'payment_id' => $payment->id,
            ], 200);

        } catch (\Exception $e) {
            Log::error('VNPay create payment error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo thanh toán',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function vnpayReturn(Request $request)
    {
        try {
            $responseData = $request->all();

            // Validate checksum
            if (!$this->vnpayService->validateResponse($responseData)) {
                return redirect(config('app.frontend_url') . '/payment/failed?error=invalid_signature');
            }

            $vnpTxnRef = $responseData['vnp_TxnRef'];
            $vnpResponseCode = $responseData['vnp_ResponseCode'];
            $vnpTransactionNo = $responseData['vnp_TransactionNo'] ?? null;
            $vnpAmount = $responseData['vnp_Amount'] / 100; // Chia 100 để trả về số tiền thực

            // Lấy order_id từ vnp_TxnRef (format: order_id_timestamp)
            $orderId = explode('_', $vnpTxnRef)[0];
            $order = Order::find($orderId);

            if (!$order) {
                return redirect(config('app.frontend_url') . '/payment/failed?error=order_not_found');
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

                    DB::commit();
                    return redirect(config('app.frontend_url') . '/payment/success?order_id=' . $order->id);
                } else {
                    DB::commit();
                    return redirect(config('app.frontend_url') . '/payment/failed?order_id=' . $order->id . '&code=' . $vnpResponseCode);
                }
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('VNPay return processing error: ' . $e->getMessage());
                return redirect(config('app.frontend_url') . '/payment/failed?error=processing_error');
            }

        } catch (\Exception $e) {
            Log::error('VNPay return error: ' . $e->getMessage());
            return redirect(config('app.frontend_url') . '/payment/failed?error=system_error');
        }
    }
    
    public function vnpayIPN(Request $request)
    {
        try {
            $responseData = $request->all();

            // Validate checksum
            if (!$this->vnpayService->validateResponse($responseData)) {
                return response()->json([
                    'RspCode' => '97',
                    'Message' => 'Invalid Signature'
                ]);
            }

            $vnpTxnRef = $responseData['vnp_TxnRef'];
            $vnpResponseCode = $responseData['vnp_ResponseCode'];
            $vnpTransactionNo = $responseData['vnp_TransactionNo'] ?? null;
            $vnpAmount = $responseData['vnp_Amount'] / 100;

            // Lấy order_id từ vnp_TxnRef
            $orderId = explode('_', $vnpTxnRef)[0];
            $order = Order::find($orderId);

            if (!$order) {
                return response()->json([
                    'RspCode' => '01',
                    'Message' => 'Order not found'
                ]);
            }

            // Kiểm tra order đã được xử lý chưa
            if ($order->payment_status === 'paid') {
                return response()->json([
                    'RspCode' => '02',
                    'Message' => 'Order already confirmed'
                ]);
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

                return response()->json([
                    'RspCode' => '00',
                    'Message' => 'Confirm Success'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('VNPay IPN processing error: ' . $e->getMessage());
                return response()->json([
                    'RspCode' => '99',
                    'Message' => 'Unknown error'
                ]);
            }

        } catch (\Exception $e) {
            Log::error('VNPay IPN error: ' . $e->getMessage());
            return response()->json([
                'RspCode' => '99',
                'Message' => 'System error'
            ]);
        }
    }
}
