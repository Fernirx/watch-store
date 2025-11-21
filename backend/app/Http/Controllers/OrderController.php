<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Order::with(['items.product', 'user']);
            if ($user->role !== 'ADMIN') {
                $query->where('user_id', $user->id);
            }
            $orders = $query->orderBy('created_at', 'desc')->get();
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

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'shipping_address' => 'required|string',
                'shipping_phone' => 'required|string',
                'payment_method' => 'required|in:cod,bank_transfer,vnpay',
                'notes' => 'nullable|string',
            ]);
            $user = $request->user();
            $cart = Cart::with('items.product')->where('user_id', $user->id)->first();
            if (!$cart || $cart->items->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cart is empty',
                ], 400);
            }
            DB::beginTransaction();
            try {
                foreach ($cart->items as $item) {
                    if ($item->product->stock_quantity < $item->quantity) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Insufficient stock for {$item->product->name}",
                        ], 400);
                    }
                }
                $subtotal = $cart->items->sum(function ($item) {
                    return $item->price * $item->quantity;
                });
                $shipping_fee = 30000;
                $total = $subtotal + $shipping_fee;
                $order = Order::create([
                    'user_id' => $user->id,
                    'order_number' => 'ORD-' . strtoupper(uniqid()),
                    'status' => 'PENDING',
                    'subtotal' => $subtotal,
                    'shipping_fee' => $shipping_fee,
                    'total' => $total,
                    'payment_method' => $validated['payment_method'],
                    'payment_status' => 'PENDING',
                    'shipping_address' => $validated['shipping_address'],
                    'shipping_phone' => $validated['shipping_phone'],
                    'notes' => $validated['notes'] ?? null,
                ]);



                foreach ($cart->items as $cartItem) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $cartItem->product_id,
                        'product_name' => $cartItem->product->name,
                        'quantity' => $cartItem->quantity,
                        'price' => $cartItem->price,
                        'subtotal' => $cartItem->price * $cartItem->quantity,
                    ]); $cartItem->product->decrement('stock_quantity', $cartItem->quantity);
                }
                $cart->items()->delete();
                DB::commit();
                $order->load('items.product');
                return response()->json([
                    'success' => true,
                    'message' => 'Order created successfully',
                    'data' => $order,
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function show(Request $request, string $id)
    {
        try {
            $user = $request->user();
            $query = Order::with(['items.product.category', 'items.product.brand', 'user']);
            if ($user->role !== 'ADMIN') {
                $query->where('user_id', $user->id);
            }

            $order = $query->where('id', $id)->firstOrFail();

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


    public function updateStatus(Request $request, string $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
            ]);
            $order = Order::with('items.product')->findOrFail($id);
            $oldStatus = $order->status;
            $newStatus = strtoupper($validated['status']);
            $order->status = $newStatus;
            $order->save();

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

    public function cancel(Request $request, string $id)
    {
        try {
            $user = $request->user();

            $order = Order::with('items.product')
                ->where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();
            if (!in_array($order->status, ['PENDING', 'PAID'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot cancel order in current status',
                ], 400);
            }
            DB::beginTransaction();
            try {
                foreach ($order->items as $item) {
                    $item->product->increment('stock_quantity', $item->quantity);
                }
                $order->status = 'CANCELLED';
                $order->save();
                DB::commit();
                return response()->json([
                    'success' => true,
                    'message' => 'Order cancelled successfully',
                    'data' => $order,
                ], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    
}
