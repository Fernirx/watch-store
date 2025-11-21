<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $cart = Cart::with(['items.product.category', 'items.product.brand'])
                ->firstOrCreate(['user_id' => $user->id]);
            $subtotal = $cart->items->sum(function ($item) {
                $price = $item->product->sale_price ?? $item->product->price;
                return $price * $item->quantity;
            });
            return response()->json([
                'success' => true,
                'data' => [
                    'cart' => $cart,
                    'subtotal' => $subtotal,
                    'items_count' => $cart->items->sum('quantity'),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch cart',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|integer|min:1',
            ]);
            $user = $request->user();
            $product = Product::findOrFail($validated['product_id']);
            if ($product->stock_quantity < $validated['quantity']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock',
                ], 400);
            }
            $cart = Cart::firstOrCreate(['user_id' => $user->id]);
            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $validated['product_id'])
                ->first();
            if ($cartItem) {
                $newQuantity = $cartItem->quantity + $validated['quantity'];
                if ($product->stock_quantity < $newQuantity) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient stock',
                    ], 400);
                }
                $cartItem->quantity = $newQuantity;
                $cartItem->save();
            } else {
                $price = $product->sale_price ?? $product->price;
                $cartItem = CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'price' => $price,
                ]);
            }
            $cartItem->load('product');
            return response()->json([
                'success' => true,
                'message' => 'Item added to cart',
                'data' => $cartItem,
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
                'message' => 'Failed to add item to cart',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, string $id)
    {
        try {
            $validated = $request->validate([
                'quantity' => 'required|integer|min:1',
            ]);
            $user = $request->user();
            $cart = Cart::where('user_id', $user->id)->firstOrFail();
            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('id', $id)
                ->firstOrFail();
            if ($cartItem->product->stock_quantity < $validated['quantity']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock',
                ], 400);
            }
            $cartItem->quantity = $validated['quantity'];
            $cartItem->save();
            $cartItem->load('product');
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
                'message' => 'Failed to update cart item',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    public function destroy(string $id) {
        try {
            $user = request()->user();
            $cart = Cart::where('user_id', $user->id)->firstOrFail();
            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('id', $id)
                ->firstOrFail();
            $cartItem->delete();
            return response()->json([
                'success' => true,
                'message' => 'Item removed from cart',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove item',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function clear(Request $request)
    {
        try {
            $user = $request->user();
            $cart = Cart::where('user_id', $user->id)->first();

            if ($cart) {
                $cart->items()->delete();
            }
            return response()->json([
                'success' => true,
                'message' => 'Cart cleared',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cart',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
