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

        // Check stock availability và add thông tin vào mỗi item
        $hasOutOfStock = false;
        $cart->items->each(function ($item) use (&$hasOutOfStock) {
            $product = $item->product;

            // Check stock availability
            $item->is_available = $product->stock_quantity >= $item->quantity;
            $item->available_stock = $product->stock_quantity;

            if (!$item->is_available) {
                $hasOutOfStock = true;
                if ($product->stock_quantity === 0) {
                    $item->stock_message = 'Sản phẩm đã hết hàng';
                } else {
                    $item->stock_message = "Chỉ còn {$product->stock_quantity} sản phẩm";
                }
            }
        });

        $subtotal = $cart->items->sum(function ($item) {
            $price = $item->product->price;
            return $price * $item->quantity;
        });

        return [
            'cart' => $cart,
            'subtotal' => $subtotal,
            'items_count' => $cart->items->sum('quantity'),
            'has_out_of_stock' => $hasOutOfStock,
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
            $price = $product->price;
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
        // Validate guest session exists and is not expired
        $session = GuestSession::where('guest_token', $guestToken)->first();
        if (!$session) {
            throw new \Exception('Guest session not found. Please refresh the page.');
        }
        if ($session->isExpired()) {
            throw new \Exception('Guest session expired. Please refresh the page.');
        }

        $cart = Cart::with(['items.product.category', 'items.product.brand'])
            ->where('guest_token', $guestToken)
            ->first();

        if (!$cart) {
            return [
                'cart' => null,
                'subtotal' => 0,
                'items_count' => 0,
                'has_out_of_stock' => false,
            ];
        }

        // Check stock availability và add thông tin vào mỗi item
        $hasOutOfStock = false;
        $cart->items->each(function ($item) use (&$hasOutOfStock) {
            $product = $item->product;

            // Check stock availability
            $item->is_available = $product->stock_quantity >= $item->quantity;
            $item->available_stock = $product->stock_quantity;

            if (!$item->is_available) {
                $hasOutOfStock = true;
                if ($product->stock_quantity === 0) {
                    $item->stock_message = 'Sản phẩm đã hết hàng';
                } else {
                    $item->stock_message = "Chỉ còn {$product->stock_quantity} sản phẩm";
                }
            }
        });

        $subtotal = $cart->items->sum(function ($item) {
            $price = $item->product->price;
            return $price * $item->quantity;
        });

        return [
            'cart' => $cart,
            'subtotal' => $subtotal,
            'items_count' => $cart->items->sum('quantity'),
            'has_out_of_stock' => $hasOutOfStock,
        ];
    }

    /**
     * Thêm sản phẩm vào giỏ hàng guest
     */
    public function addToGuestCart(string $guestToken, int $productId, int $quantity): CartItem
    {
        // Validate guest session exists and is not expired
        $session = GuestSession::where('guest_token', $guestToken)->first();
        if (!$session) {
            throw new \Exception('Guest session not found. Please refresh the page.');
        }
        if ($session->isExpired()) {
            throw new \Exception('Guest session expired. Please refresh the page.');
        }

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
            $price = $product->price;
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
        // Validate guest session
        $session = GuestSession::where('guest_token', $guestToken)->first();
        if (!$session || $session->isExpired()) {
            throw new \Exception('Guest session not found or expired. Please refresh the page.');
        }

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
        // Validate guest session
        $session = GuestSession::where('guest_token', $guestToken)->first();
        if (!$session || $session->isExpired()) {
            throw new \Exception('Guest session not found or expired. Please refresh the page.');
        }

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
        // Validate guest session
        $session = GuestSession::where('guest_token', $guestToken)->first();
        if (!$session || $session->isExpired()) {
            throw new \Exception('Guest session not found or expired. Please refresh the page.');
        }

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
        \Log::info('🛒 Starting merge - Guest token: ' . $guestToken . ', User ID: ' . $userId);

        $guestCart = Cart::where('guest_token', $guestToken)->first();

        if (!$guestCart) {
            \Log::warning('⚠️ No guest cart found for token: ' . $guestToken);
            return;
        }

        if ($guestCart->items->isEmpty()) {
            \Log::warning('⚠️ Guest cart is empty');
            return;
        }

        \Log::info('📦 Guest cart has ' . $guestCart->items->count() . ' items');

        // Lấy hoặc tạo giỏ hàng của user
        $userCart = Cart::firstOrCreate(['user_id' => $userId]);
        \Log::info('👤 User cart ID: ' . $userCart->id . ', has ' . $userCart->items->count() . ' items');

        // Merge từng item
        $mergedCount = 0;
        $createdCount = 0;
        foreach ($guestCart->items as $guestItem) {
            $existingItem = CartItem::where('cart_id', $userCart->id)
                ->where('product_id', $guestItem->product_id)
                ->first();

            if ($existingItem) {
                // Cộng dồn số lượng
                $newQuantity = $existingItem->quantity + $guestItem->quantity;

                // Kiểm tra tồn kho
                if ($guestItem->product->stock_quantity >= $newQuantity) {
                    \Log::info('➕ Merging product #' . $guestItem->product_id . ': ' . $existingItem->quantity . ' + ' . $guestItem->quantity . ' = ' . $newQuantity);
                    $existingItem->quantity = $newQuantity;
                    $existingItem->save();
                    $mergedCount++;
                } else {
                    \Log::warning('⚠️ Insufficient stock for product #' . $guestItem->product_id);
                }
            } else {
                // Tạo item mới trong giỏ user
                \Log::info('✨ Creating new item for product #' . $guestItem->product_id . ', quantity: ' . $guestItem->quantity);
                CartItem::create([
                    'cart_id' => $userCart->id,
                    'product_id' => $guestItem->product_id,
                    'quantity' => $guestItem->quantity,
                    'price' => $guestItem->price,
                ]);
                $createdCount++;
            }
        }

        \Log::info('✅ Merge summary - Merged: ' . $mergedCount . ', Created: ' . $createdCount);

        // Xóa giỏ hàng guest sau khi merge
        $guestCart->items()->delete();
        $guestCart->delete();
        \Log::info('🗑️ Guest cart deleted');
    }
}
