<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;

class CartService
{
    /**
     * Lấy giỏ hàng của user
     */
    public function getCart(int $userId): array
    {
        $cart = Cart::with(['items.product.category', 'items.product.brand'])
            ->firstOrCreate(['user_id' => $userId]);

        $subtotal = $cart->items->sum(function ($item) {
            $price = $item->product->sale_price ?? $item->product->price;
            return $price * $item->quantity;
        });

        return [
            'cart' => $cart,
            'subtotal' => $subtotal,
            'items_count' => $cart->items->sum('quantity'),
        ];
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     */
    public function addToCart(int $userId, int $productId, int $quantity): CartItem
    {
        $product = Product::findOrFail($productId);

        // Kiểm tra tồn kho
        if ($product->stock_quantity < $quantity) {
            throw new \Exception('Insufficient stock');
        }

        // Lấy hoặc tạo giỏ hàng
        $cart = Cart::firstOrCreate(['user_id' => $userId]);

        // Kiểm tra sản phẩm đã có trong giỏ chưa
        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->first();

        if ($cartItem) {
            // Cập nhật số lượng
            $newQuantity = $cartItem->quantity + $quantity;

            if ($product->stock_quantity < $newQuantity) {
                throw new \Exception('Insufficient stock');
            }

            $cartItem->quantity = $newQuantity;
            $cartItem->save();
        } else {
            // Tạo cart item mới
            $price = $product->sale_price ?? $product->price;
            $cartItem = CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $productId,
                'quantity' => $quantity,
                'price' => $price,
            ]);
        }

        return $cartItem->load('product');
    }

    /**
     * Cập nhật số lượng sản phẩm trong giỏ
     */
    public function updateCartItem(int $userId, int $cartItemId, int $quantity): CartItem
    {
        $cart = Cart::where('user_id', $userId)->firstOrFail();

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('id', $cartItemId)
            ->firstOrFail();

        // Kiểm tra tồn kho
        if ($cartItem->product->stock_quantity < $quantity) {
            throw new \Exception('Insufficient stock');
        }

        $cartItem->quantity = $quantity;
        $cartItem->save();

        return $cartItem->load('product');
    }

    /**
     * Xóa sản phẩm khỏi giỏ hàng
     */
    public function removeFromCart(int $userId, int $cartItemId): void
    {
        $cart = Cart::where('user_id', $userId)->firstOrFail();

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('id', $cartItemId)
            ->firstOrFail();

        $cartItem->delete();
    }

    /**
     * Xóa toàn bộ giỏ hàng
     */
    public function clearCart(int $userId): void
    {
        $cart = Cart::where('user_id', $userId)->first();

        if ($cart) {
            $cart->items()->delete();
        }
    }
}
