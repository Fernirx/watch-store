<?php

namespace App\Services;

use App\Mail\OrderConfirmationMail;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class OrderService
{
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
            // Kiểm tra tồn kho cho tất cả sản phẩm
            foreach ($cart->items as $item) {
                if ($item->product->stock_quantity < $item->quantity) {
                    throw new \Exception("Insufficient stock for {$item->product->name}");
                }
            }

            // Tính toán tổng tiền
            $subtotal = $cart->items->sum(function ($item) {
                return $item->price * $item->quantity;
            });

            $shipping_fee = 30000; // 30k cố định
            $total = $subtotal + $shipping_fee;

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
                'payment_status' => 'PENDING',
                'shipping_address' => $data['shipping_address'],
                'shipping_phone' => $data['shipping_phone'],
                'notes' => $data['notes'] ?? null,
            ]);

            // Tạo order items và giảm tồn kho
            foreach ($cart->items as $cartItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'product_name' => $cartItem->product->name,
                    'quantity' => $cartItem->quantity,
                    'price' => $cartItem->price,
                    'subtotal' => $cartItem->price * $cartItem->quantity,
                ]);

                // Giảm tồn kho
                $cartItem->product->decrement('stock_quantity', $cartItem->quantity);
            }

            // Xóa giỏ hàng
            $cart->items()->delete();

            DB::commit();

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

        $order->status = strtoupper($status);
        $order->save();

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

        // Chỉ cho phép hủy đơn PENDING hoặc PAID
        if (!in_array($order->status, ['PENDING', 'PAID'])) {
            throw new \Exception('Cannot cancel order in current status');
        }

        DB::beginTransaction();
        try {
            // Hoàn lại tồn kho
            foreach ($order->items as $item) {
                $item->product->increment('stock_quantity', $item->quantity);
            }

            // Cập nhật trạng thái
            $order->status = 'CANCELLED';
            $order->save();

            DB::commit();

            return $order;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
