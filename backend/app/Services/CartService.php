<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\GuestSession;
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

    // ========== GUEST CART METHODS ==========

    /**
     * Lấy giỏ hàng của guest
     */
    public function getGuestCart(string $guestToken): array
    {
        $cart = Cart::with(['items.product.category', 'items.product.brand'])
            ->where('guest_token', $guestToken)
            ->first();

        if (!$cart) {
            return [
                'cart' => null,
                'subtotal' => 0,
                'items_count' => 0,
            ];
        }

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
     * Thêm sản phẩm vào giỏ hàng guest
     */
    public function addToGuestCart(string $guestToken, int $productId, int $quantity): CartItem
    {
        $product = Product::findOrFail($productId);

        // Kiểm tra tồn kho
        if ($product->stock_quantity < $quantity) {
            throw new \Exception('Insufficient stock');
        }

        // Lấy hoặc tạo giỏ hàng guest
        $cart = Cart::firstOrCreate(['guest_token' => $guestToken]);

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
     * Cập nhật số lượng sản phẩm trong giỏ guest
     */
    public function updateGuestCartItem(string $guestToken, int $cartItemId, int $quantity): CartItem
    {
        $cart = Cart::where('guest_token', $guestToken)->firstOrFail();

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
     * Xóa sản phẩm khỏi giỏ hàng guest
     */
    public function removeFromGuestCart(string $guestToken, int $cartItemId): void
    {
        $cart = Cart::where('guest_token', $guestToken)->firstOrFail();

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('id', $cartItemId)
            ->firstOrFail();

        $cartItem->delete();
    }

    /**
     * Xóa toàn bộ giỏ hàng guest
     */
    public function clearGuestCart(string $guestToken): void
    {
        $cart = Cart::where('guest_token', $guestToken)->first();

        if ($cart) {
            $cart->items()->delete();
        }
    }

    /**
     * Merge guest cart to user cart when login
     */
    public function mergeGuestCartToUser(string $guestToken, int $userId): void
    {
        $guestCart = Cart::where('guest_token', $guestToken)->first();

        if (!$guestCart || $guestCart->items->isEmpty()) {
            return; // Không có giỏ hàng guest hoặc giỏ rỗng
        }

        // Lấy hoặc tạo giỏ hàng của user
        $userCart = Cart::firstOrCreate(['user_id' => $userId]);

        // Merge từng item
        foreach ($guestCart->items as $guestItem) {
            $existingItem = CartItem::where('cart_id', $userCart->id)
                ->where('product_id', $guestItem->product_id)
                ->first();

            if ($existingItem) {
                // Cộng dồn số lượng
                $newQuantity = $existingItem->quantity + $guestItem->quantity;

                // Kiểm tra tồn kho
                if ($guestItem->product->stock_quantity >= $newQuantity) {
                    $existingItem->quantity = $newQuantity;
                    $existingItem->save();
                }
                // Nếu không đủ stock, giữ nguyên số lượng cũ
            } else {
                // Tạo item mới trong giỏ user
                CartItem::create([
                    'cart_id' => $userCart->id,
                    'product_id' => $guestItem->product_id,
                    'quantity' => $guestItem->quantity,
                    'price' => $guestItem->price,
                ]);
            }
        }

        // Xóa giỏ hàng guest sau khi merge
        $guestCart->items()->delete();
        $guestCart->delete();
    }
}
