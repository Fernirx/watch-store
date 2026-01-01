<?php

namespace App\Services;

use App\Helpers\BusinessValidator;
use App\Mail\OrderConfirmationMail;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StockTransaction;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class OrderService
{
    protected CouponService $couponService;

    public function __construct(CouponService $couponService)
    {
        $this->couponService = $couponService;
    }

    /**
     * Lấy danh sách đơn hàng
     */
    public function getOrders(int $userId, bool $isAdmin = false): Collection
    {
        $query = Order::with(['items.product', 'user']);

        if (!$isAdmin) {
            $query->where('user_id', $userId);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Lấy chi tiết đơn hàng
     */
    public function getOrderById(int $orderId, int $userId, bool $isAdmin = false): ?Order
    {
        $query = Order::with(['items.product.category', 'items.product.brand', 'user']);

        if (!$isAdmin) {
            $query->where('user_id', $userId);
        }

        return $query->where('id', $orderId)->first();
    }

    /**
     * Tạo đơn hàng mới từ giỏ hàng (hỗ trợ cả user và guest)
     */
    public function createOrder(?int $userId, array $data, ?string $guestToken = null): Order
    {
        // Tìm cart theo user_id hoặc guest_token
        // QUAN TRỌNG: Ưu tiên user_id nếu đã login!
        $cartQuery = Cart::with('items.product');

        if ($userId) {
            // User đã login → tìm theo user_id (KHÔNG dùng guest_token)
            $cartQuery->where('user_id', $userId);
            \Log::info('🛒 Finding cart for user_id: ' . $userId);
        } elseif ($guestToken) {
            // Guest → tìm theo guest_token
            $cartQuery->where('guest_token', $guestToken);
            \Log::info('🛒 Finding cart for guest_token: ' . $guestToken);
        } else {
            throw new \Exception('Either user_id or guest_token is required');
        }

        $cart = $cartQuery->first();

        if (!$cart || $cart->items->isEmpty()) {
            throw new \Exception('Cart is empty');
        }

        DB::beginTransaction();
        try {
            // NOTE: Stock validation sẽ được thực hiện với locking trong vòng lặp tạo order items
            // để tránh race condition

            // Tính toán tổng tiền
            $subtotal = $cart->items->sum(function ($item) {
                return $item->price * $item->quantity;
            });

            $shipping_fee = (int) env('SHIPPING_FEE', 30000);
            $discount_amount = 0;
            $couponId = null;
            $couponCode = null;
            $couponData = null;

            // Process coupon if provided
            if (!empty($data['coupon_code'])) {
                $validation = $this->couponService->validateCoupon(
                    $data['coupon_code'],
                    $subtotal,
                    $data['customer_email'],
                    $data['shipping_phone'],
                    $userId
                );

                if (!$validation['valid']) {
                    throw new \Exception($validation['message']);
                }

                $discount_amount = $validation['discount_amount'];
                $couponId = $validation['coupon']->id;
                $couponCode = $validation['coupon']->code;
                $couponData = $validation['coupon'];
            }

            // Calculate total with discount
            $total = $subtotal + $shipping_fee - $discount_amount;

            // Tạo đơn hàng
            $order = Order::create([
                'user_id' => $userId,
                'guest_token' => $guestToken,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'order_number' => 'ORD-' . strtoupper(uniqid()),
                'status' => 'PENDING',
                'subtotal' => $subtotal,
                'shipping_fee' => $shipping_fee,
                'total' => $total,
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
                'shipping_address' => $data['shipping_address'],
                'shipping_phone' => $data['shipping_phone'],
                'coupon_id' => $couponId,
                'coupon_code' => $couponCode,
                'discount_amount' => $discount_amount,
                'notes' => $data['notes'] ?? null,
            ]);

            // Tạo order items và giảm tồn kho (WITH PESSIMISTIC LOCKING)
            foreach ($cart->items as $cartItem) {
                // CRITICAL: Lock product row để tránh race condition
                $product = \App\Models\Product::lockForUpdate()->find($cartItem->product_id);

                if (!$product) {
                    throw new \Exception("Product not found: {$cartItem->product_id}");
                }

                // Check stock AFTER locking để đảm bảo atomic check-and-decrement
                if ($product->stock_quantity < $cartItem->quantity) {
                    throw new \Exception("Sản phẩm '{$product->name}' không đủ hàng. Chỉ còn {$product->stock_quantity} sản phẩm, bạn đang đặt {$cartItem->quantity}. Vui lòng giảm số lượng trong giỏ hàng và thử lại.");
                }

                // Tạo order item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'product_name' => $product->name,
                    'quantity' => $cartItem->quantity,
                    'price' => $cartItem->price,
                    'subtotal' => $cartItem->price * $cartItem->quantity,
                ]);

                // Giảm tồn kho (product đã được lock, an toàn)
                $product->decrement('stock_quantity', $cartItem->quantity);

                // Kiểm tra stock âm sau khi giảm (defensive check)
                $product->refresh();
                BusinessValidator::checkNegativeStock(
                    $product->id,
                    $product->stock_quantity,
                    $product->name
                );

                // Tạo stock transaction để track
                StockTransaction::create([
                    'type' => 'EXPORT',
                    'product_id' => $cartItem->product_id,
                    'quantity' => $cartItem->quantity,
                    'reference_type' => 'ORDER',
                    'reference_id' => $order->id,
                    'performed_by' => $userId ?? 1, // Guest = admin user 1
                    'notes' => "Stock exported for order #{$order->order_number}",
                    'transaction_date' => now(),
                ]);
            }

            // Apply coupon if used
            if ($couponId && $couponData) {
                $this->couponService->applyCoupon(
                    $couponData,
                    $order->id,
                    $discount_amount,
                    $data['customer_email'],
                    $data['shipping_phone'],
                    $userId,
                    $guestToken
                );
            }

            // Xóa giỏ hàng
            // QUAN TRỌNG: Với VNPay, chỉ xóa cart SAU KHI thanh toán thành công
            // Với COD, xóa ngay
            if ($data['payment_method'] !== 'vnpay') {
                $cart->items()->delete();
                \Log::info("🗑️ Cart cleared for payment method: {$data['payment_method']}");
            } else {
                \Log::info("⏳ Cart preserved for VNPay payment, will be cleared after payment success");
            }

            DB::commit();

            // Log business event: Đơn hàng mới được tạo
            BusinessValidator::logBusinessEvent('ORDER_CREATED', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'user_id' => $userId,
                'guest_token' => $guestToken,
                'total' => $order->total,
                'payment_method' => $order->payment_method,
                'items_count' => $cart->items->count(),
            ]);

            // Gửi email xác nhận đơn hàng
            try {
                Mail::to($order->customer_email)->send(new OrderConfirmationMail($order->load('items.product')));
                \Log::info('📧 Order confirmation email sent to: ' . $order->customer_email);
            } catch (\Exception $e) {
                \Log::error('❌ Failed to send order confirmation email: ' . $e->getMessage());
                // Không throw exception để không ảnh hưởng đến order creation
            }

            return $order->load('items.product');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cập nhật trạng thái đơn hàng (Admin)
     */
    public function updateOrderStatus(int $orderId, string $status): Order
    {
        $order = Order::with('items.product')->findOrFail($orderId);

        $oldStatus = $order->status;
        $newStatus = strtoupper($status);

        // BUSINESS RULE: Không cho phép COMPLETED nếu chưa thanh toán
        if ($newStatus === 'COMPLETED' && $order->payment_status !== 'paid') {
            throw new \Exception('Không thể hoàn thành đơn hàng khi chưa thanh toán. Vui lòng đánh dấu "Đã thanh toán" trước.');
        }

        $order->status = $newStatus;
        $order->save();

        // Kiểm tra tính nhất quán order-payment sau khi cập nhật
        BusinessValidator::checkOrderPaymentConsistency(
            $order->id,
            $order->order_number,
            $order->status,
            $order->payment_status,
            $order->total
        );

        // Log event quan trọng
        BusinessValidator::logBusinessEvent('ORDER_STATUS_UPDATED', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);

        return $order;
    }

    /**
     * Cập nhật trạng thái thanh toán (Admin - dành cho COD)
     */
    public function updatePaymentStatus(int $orderId, string $paymentStatus): Order
    {
        $order = Order::with('items.product')->findOrFail($orderId);

        $oldPaymentStatus = $order->payment_status;
        $order->payment_status = $paymentStatus;
        $order->save();

        // Kiểm tra tính nhất quán order-payment sau khi cập nhật
        BusinessValidator::checkOrderPaymentConsistency(
            $order->id,
            $order->order_number,
            $order->status,
            $order->payment_status,
            $order->total
        );

        // Log event quan trọng
        BusinessValidator::logBusinessEvent('PAYMENT_STATUS_UPDATED', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'old_payment_status' => $oldPaymentStatus,
            'new_payment_status' => $paymentStatus,
        ]);

        return $order;
    }

    /**
     * Hủy đơn hàng
     */
    public function cancelOrder(int $orderId, int $userId): Order
    {
        $order = Order::with('items.product')
            ->where('user_id', $userId)
            ->where('id', $orderId)
            ->firstOrFail();

        // Chỉ cho phép hủy đơn PENDING
        if ($order->status !== 'PENDING') {
            throw new \Exception('Cannot cancel order in current status');
        }

        // KHÔNG cho phép hủy nếu đã thanh toán
        if ($order->payment_status === 'paid') {
            throw new \Exception('Cannot cancel paid order. Please contact admin for refund.');
        }

        DB::beginTransaction();
        try {
            // Hoàn lại tồn kho
            foreach ($order->items as $item) {
                $item->product->increment('stock_quantity', $item->quantity);

                // Tạo stock transaction để track
                StockTransaction::create([
                    'type' => 'IMPORT',
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'reference_type' => 'ORDER_CANCELLED',
                    'reference_id' => $order->id,
                    'performed_by' => $userId,
                    'notes' => "Stock restored from cancelled order #{$order->order_number}",
                    'transaction_date' => now(),
                ]);
            }

            // Restore coupon usage if applicable
            if ($order->coupon_id) {
                $this->couponService->restoreCouponUsage($orderId);
            }

            // Cập nhật trạng thái
            $oldStatus = $order->status;
            $order->status = 'CANCELLED';
            $order->save();

            // Kiểm tra tính nhất quán order-payment
            BusinessValidator::checkOrderPaymentConsistency(
                $order->id,
                $order->order_number,
                $order->status,
                $order->payment_status,
                $order->total
            );

            // Log event hủy đơn
            BusinessValidator::logBusinessEvent('ORDER_CANCELLED', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'user_id' => $userId,
                'old_status' => $oldStatus,
                'total' => $order->total,
            ]);

            // Trả sản phẩm về giỏ hàng (nếu user muốn mua lại)
            $this->restoreCartFromOrder($order);

            DB::commit();

            return $order;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Restore cart items từ order (khi cancel hoặc payment failed)
     */
    public function restoreCartFromOrder(Order $order): void
    {
        // Chỉ restore cart nếu order có user_id hoặc guest_token
        if (!$order->user_id && !$order->guest_token) {
            return;
        }

        // BUSINESS RULE: KHÔNG restore cart nếu payment_method là VNPay
        // Vì với VNPay, cart KHÔNG bị xóa khi tạo order (để user có thể back)
        // Nếu restore sẽ gây duplicate items
        if ($order->payment_method === 'vnpay') {
            \Log::info("⏭️ Skip restore cart for VNPay order #{$order->order_number} - cart was preserved");
            return;
        }

        // Tìm hoặc tạo cart
        $cart = Cart::firstOrCreate(
            [
                'user_id' => $order->user_id,
                'guest_token' => $order->guest_token,
            ]
        );

        // Thêm lại các items vào cart
        foreach ($order->items as $orderItem) {
            // Kiểm tra xem item đã có trong cart chưa
            $existingCartItem = $cart->items()->where('product_id', $orderItem->product_id)->first();

            if ($existingCartItem) {
                // Nếu đã có, tăng số lượng
                $existingCartItem->quantity += $orderItem->quantity;
                $existingCartItem->save();
            } else {
                // Nếu chưa có, tạo mới
                $cart->items()->create([
                    'product_id' => $orderItem->product_id,
                    'quantity' => $orderItem->quantity,
                    'price' => $orderItem->price,
                ]);
            }
        }

        \Log::info("✅ Restored cart from order #{$order->order_number}");
    }
}
