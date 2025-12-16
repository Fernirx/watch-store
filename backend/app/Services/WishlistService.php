<?php

namespace App\Services;

use App\Models\Wishlist;
use App\Models\WishlistItem;
use App\Models\Product;

class WishlistService
{
    protected CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    /**
     * Lấy wishlist của user
     */
    public function getWishlist(int $userId): array
    {
        $wishlist = Wishlist::with(['items.product.category', 'items.product.brand'])
            ->firstOrCreate(['user_id' => $userId]);

        return [
            'wishlist' => $wishlist,
            'items_count' => $wishlist->items->count(),
        ];
    }

    /**
     * Thêm product vào wishlist
     */
    public function addToWishlist(int $userId, int $productId): WishlistItem
    {
        // Validate product exists
        $product = Product::findOrFail($productId);

        // Get or create wishlist
        $wishlist = Wishlist::firstOrCreate(['user_id' => $userId]);

        // Check if product already in wishlist
        $existingItem = WishlistItem::where('wishlist_id', $wishlist->id)
            ->where('product_id', $productId)
            ->first();

        if ($existingItem) {
            throw new \Exception('Sản phẩm đã có trong danh sách yêu thích');
        }

        // Create new wishlist item
        $wishlistItem = WishlistItem::create([
            'wishlist_id' => $wishlist->id,
            'product_id' => $productId,
        ]);

        return $wishlistItem->load('product');
    }

    /**
     * Xóa item khỏi wishlist
     */
    public function removeFromWishlist(int $userId, int $wishlistItemId): void
    {
        $wishlist = Wishlist::where('user_id', $userId)->firstOrFail();

        $wishlistItem = WishlistItem::where('wishlist_id', $wishlist->id)
            ->where('id', $wishlistItemId)
            ->firstOrFail();

        $wishlistItem->delete();
    }

    /**
     * Xóa toàn bộ wishlist
     */
    public function clearWishlist(int $userId): void
    {
        $wishlist = Wishlist::where('user_id', $userId)->first();

        if ($wishlist) {
            $wishlist->items()->delete();
        }
    }

    /**
     * Chuyển item từ wishlist sang cart
     */
    public function moveToCart(int $userId, int $wishlistItemId, int $quantity = 1): mixed
    {
        $wishlist = Wishlist::where('user_id', $userId)->firstOrFail();

        $wishlistItem = WishlistItem::where('wishlist_id', $wishlist->id)
            ->where('id', $wishlistItemId)
            ->with('product')
            ->firstOrFail();

        // Use CartService to add to cart
        $cartItem = $this->cartService->addToCart($userId, $wishlistItem->product_id, $quantity);

        // Remove from wishlist after successful cart addition
        $wishlistItem->delete();

        return $cartItem;
    }

    /**
     * Check xem product có trong wishlist không
     */
    public function isInWishlist(int $userId, int $productId): bool
    {
        $wishlist = Wishlist::where('user_id', $userId)->first();

        if (!$wishlist) {
            return false;
        }

        return WishlistItem::where('wishlist_id', $wishlist->id)
            ->where('product_id', $productId)
            ->exists();
    }
}
