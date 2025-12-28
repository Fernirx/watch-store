<?php

namespace App\Services;

use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

class ReviewService
{
    /**
     * Kiểm tra xem user/guest đã mua sản phẩm chưa (chỉ dùng email)
     */
    public function hasUserPurchasedProduct(int $productId, ?int $userId = null, ?string $email = null): ?int
    {
        $query = Order::where('status', 'COMPLETED')
            ->where('payment_status', 'paid')  // CRITICAL: Only verified purchases (paid orders)
            ->whereHas('items', function ($q) use ($productId) {
                $q->where('product_id', $productId);
            });

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            // Guest checkout - xác thực bằng email
            if ($email) {
                $query->where('customer_email', $email);
            }
        }

        $order = $query->first();
        return $order ? $order->id : null;
    }

    /**
     * Kiểm tra xem user/guest đã review sản phẩm chưa (chỉ dùng email)
     */
    public function hasUserReviewedProduct(int $productId, ?int $userId = null, ?string $email = null): bool
    {
        $query = Review::where('product_id', $productId);

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            // Guest - xác thực bằng email
            if ($email) {
                $query->where('guest_email', $email);
            }
        }

        return $query->exists();
    }

    /**
     * Tạo review mới
     */
    public function createReview(array $data): Review
    {
        DB::beginTransaction();
        try {
            // Kiểm tra đã mua hàng chưa
            $orderId = $this->hasUserPurchasedProduct(
                $data['product_id'],
                $data['user_id'] ?? null,
                $data['guest_email'] ?? null
            );

            if (!$orderId) {
                throw new \Exception('Bạn chưa mua sản phẩm này nên không thể đánh giá.');
            }

            // Kiểm tra đã review chưa
            $hasReviewed = $this->hasUserReviewedProduct(
                $data['product_id'],
                $data['user_id'] ?? null,
                $data['guest_email'] ?? null
            );

            if ($hasReviewed) {
                throw new \Exception('Bạn đã đánh giá sản phẩm này rồi.');
            }

            // Tạo review
            $review = Review::create([
                'product_id' => $data['product_id'],
                'order_id' => $orderId,
                'user_id' => $data['user_id'] ?? null,
                'guest_email' => $data['guest_email'] ?? null,
                'guest_name' => $data['guest_name'] ?? null,
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? null,
                'is_verified_purchase' => true,
            ]);

            // Cập nhật average rating của product
            $this->updateProductRating($data['product_id']);

            DB::commit();
            return $review->load(['user', 'product']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cập nhật review
     */
    public function updateReview(int $id, array $data): Review
    {
        DB::beginTransaction();
        try {
            $review = Review::findOrFail($id);

            $review->update([
                'rating' => $data['rating'] ?? $review->rating,
                'comment' => $data['comment'] ?? $review->comment,
            ]);

            // Cập nhật average rating của product
            $this->updateProductRating($review->product_id);

            DB::commit();
            return $review->fresh(['user', 'product']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Xóa review
     */
    public function deleteReview(int $id): bool
    {
        DB::beginTransaction();
        try {
            $review = Review::findOrFail($id);
            $productId = $review->product_id;

            $review->delete();

            // Cập nhật average rating của product
            $this->updateProductRating($productId);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cập nhật điểm trung bình của sản phẩm
     */
    public function updateProductRating(int $productId): void
    {
        $product = Product::findOrFail($productId);

        $reviewStats = Review::where('product_id', $productId)
            ->selectRaw('COUNT(*) as count, AVG(rating) as average')
            ->first();

        $product->update([
            'review_count' => $reviewStats->count ?? 0,
            'average_rating' => $reviewStats->average ? round($reviewStats->average, 2) : 0,
        ]);
    }

    /**
     * Lấy reviews của sản phẩm
     */
    public function getProductReviews(int $productId, array $filters = []): Collection
    {
        $query = Review::with(['user', 'product'])
            ->where('product_id', $productId);

        if (isset($filters['rating'])) {
            $query->where('rating', $filters['rating']);
        }

        if (isset($filters['verified_only']) && $filters['verified_only']) {
            $query->where('is_verified_purchase', true);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Lấy tất cả reviews (admin)
     */
    public function getAllReviews(array $filters = [])
    {
        $query = Review::with(['user', 'product', 'order']);

        if (isset($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['rating'])) {
            $query->where('rating', $filters['rating']);
        }

        if (isset($filters['verified'])) {
            $query->where('is_verified_purchase', $filters['verified']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('comment', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('guest_email', 'like', '%' . $filters['search'] . '%');
            });
        }

        $perPage = $filters['per_page'] ?? 20;
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Thống kê review
     */
    public function getReviewStatistics(int $productId): array
    {
        $reviews = Review::where('product_id', $productId)->get();

        $stats = [
            'total' => $reviews->count(),
            'average' => $reviews->avg('rating') ?? 0,
            'distribution' => [
                5 => $reviews->where('rating', 5)->count(),
                4 => $reviews->where('rating', 4)->count(),
                3 => $reviews->where('rating', 3)->count(),
                2 => $reviews->where('rating', 2)->count(),
                1 => $reviews->where('rating', 1)->count(),
            ],
        ];

        return $stats;
    }
}
