<?php

namespace App\Services;

use App\Helpers\BusinessValidator;
use App\Models\Coupon;
use App\Models\CouponUsage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CouponService
{
    // ========== ADMIN METHODS ==========

    /**
     * Get all coupons with usage count
     */
    public function getCoupons(): Collection
    {
        return Coupon::withCount('usages')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get coupon by ID with related data
     */
    public function getCouponById(int $id): ?Coupon
    {
        return Coupon::with(['usages.order', 'usages.user'])
            ->withCount('usages')
            ->find($id);
    }

    /**
     * Create new coupon
     */
    public function createCoupon(array $data): Coupon
    {
        $data['code'] = strtoupper($data['code']); // Always uppercase
        return Coupon::create($data);
    }

    /**
     * Update coupon
     */
    public function updateCoupon(int $id, array $data): Coupon
    {
        $coupon = Coupon::findOrFail($id);

        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }

        $coupon->update($data);
        return $coupon->fresh();
    }

    /**
     * Delete coupon
     */
    public function deleteCoupon(int $id): bool
    {
        $coupon = Coupon::findOrFail($id);

        // Don't allow deleting coupons that have been used
        if ($coupon->usage_count > 0) {
            throw new \Exception('Cannot delete coupon that has been used');
        }

        return $coupon->delete();
    }

    // ========== CUSTOMER METHODS ==========

    /**
     * Validate coupon for use
     * Returns validation result with error message or discount info
     */
    public function validateCoupon(
        string $code,
        float $subtotal,
        string $email,
        string $phone,
        ?int $userId = null
    ): array {
        $code = strtoupper($code);
        $coupon = Coupon::where('code', $code)->first();

        // Check if coupon exists
        if (!$coupon) {
            return [
                'valid' => false,
                'message' => 'Mã giảm giá không tồn tại'
            ];
        }

        // Check if active
        if (!$coupon->is_active) {
            return [
                'valid' => false,
                'message' => 'Mã giảm giá đã bị vô hiệu hóa'
            ];
        }

        // Check validity period
        if (!$coupon->isValid()) {
            return [
                'valid' => false,
                'message' => 'Mã giảm giá đã hết hạn hoặc chưa có hiệu lực'
            ];
        }

        // Check usage limit
        if ($coupon->hasReachedLimit()) {
            return [
                'valid' => false,
                'message' => 'Mã giảm giá đã hết lượt sử dụng'
            ];
        }

        // Check minimum order value
        if ($subtotal < $coupon->min_order_value) {
            return [
                'valid' => false,
                'message' => "Đơn hàng tối thiểu " . number_format($coupon->min_order_value, 0, ',', '.') . "đ"
            ];
        }

        // Check if email/phone already used this coupon
        $usageCheck = $this->hasUserUsedCoupon($coupon->id, $email, $phone);
        if ($usageCheck['used']) {
            $message = match($usageCheck['type']) {
                'email' => 'Email này đã sử dụng mã giảm giá',
                'phone' => 'Số điện thoại này đã sử dụng mã giảm giá',
                'both' => 'Email và số điện thoại này đã sử dụng mã giảm giá',
                default => 'Bạn đã sử dụng mã giảm giá này rồi'
            };

            return [
                'valid' => false,
                'message' => $message
            ];
        }

        // Calculate discount
        $discountAmount = $coupon->calculateDiscount($subtotal);

        return [
            'valid' => true,
            'coupon' => $coupon,
            'discount_amount' => $discountAmount,
            'message' => 'Mã giảm giá hợp lệ'
        ];
    }

    /**
     * Check if email/phone combination already used this coupon
     * Track by EITHER email OR phone to prevent reuse
     * Returns array with 'used' boolean and 'type' (email/phone/both)
     */
    public function hasUserUsedCoupon(int $couponId, string $email, string $phone): array
    {
        $usedByEmail = CouponUsage::where('coupon_id', $couponId)
            ->where('email', $email)
            ->exists();

        $usedByPhone = CouponUsage::where('coupon_id', $couponId)
            ->where('phone', $phone)
            ->exists();

        if ($usedByEmail && $usedByPhone) {
            return ['used' => true, 'type' => 'both'];
        } elseif ($usedByEmail) {
            return ['used' => true, 'type' => 'email'];
        } elseif ($usedByPhone) {
            return ['used' => true, 'type' => 'phone'];
        }

        return ['used' => false, 'type' => null];
    }

    /**
     * Apply coupon to order
     * Called during order creation
     */
    public function applyCoupon(
        Coupon $coupon,
        int $orderId,
        float $discountAmount,
        string $email,
        string $phone,
        ?int $userId = null,
        ?string $guestToken = null
    ): CouponUsage {
        DB::beginTransaction();
        try {
            // CRITICAL: Lock coupon row để tránh race condition
            $coupon = Coupon::lockForUpdate()->find($coupon->id);

            if (!$coupon) {
                throw new \Exception('Coupon not found');
            }

            // CHECK usage limit BEFORE increment để tránh over-limit
            if ($coupon->usage_type === 'LIMITED_USE' && $coupon->usage_count >= $coupon->max_uses) {
                throw new \Exception("Coupon '{$coupon->code}' has reached maximum usage limit ({$coupon->max_uses} uses)");
            }

            // Increment usage count (SAU khi đã check)
            $coupon->increment('usage_count');

            // Defensive check và alert nếu vẫn vượt quá (không nên xảy ra)
            if ($coupon->usage_limit > 0 && $coupon->usage_count > $coupon->usage_limit) {
                BusinessValidator::alert('COUPON_OVER_LIMIT_AFTER_INCREMENT', [
                    'coupon_id' => $coupon->id,
                    'coupon_code' => $coupon->code,
                    'usage_limit' => $coupon->usage_limit,
                    'usage_count' => $coupon->usage_count,
                    'order_id' => $orderId,
                ]);
            }

            // Record usage
            $usage = CouponUsage::create([
                'coupon_id' => $coupon->id,
                'order_id' => $orderId,
                'user_id' => $userId,
                'guest_token' => $guestToken,
                'email' => $email,
                'phone' => $phone,
                'discount_amount' => $discountAmount,
                'used_at' => now(),
            ]);

            // Log business event
            BusinessValidator::logBusinessEvent('COUPON_APPLIED', [
                'coupon_id' => $coupon->id,
                'coupon_code' => $coupon->code,
                'order_id' => $orderId,
                'discount_amount' => $discountAmount,
                'usage_count' => $coupon->usage_count,
                'usage_limit' => $coupon->usage_limit,
            ]);

            DB::commit();
            return $usage;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Restore coupon usage when order is cancelled
     */
    public function restoreCouponUsage(int $orderId): void
    {
        DB::beginTransaction();
        try {
            $usage = CouponUsage::where('order_id', $orderId)->first();

            if ($usage) {
                // Decrement usage count
                $coupon = $usage->coupon;
                $coupon->decrement('usage_count');

                // Log business event
                BusinessValidator::logBusinessEvent('COUPON_RESTORED', [
                    'coupon_id' => $coupon->id,
                    'coupon_code' => $coupon->code,
                    'order_id' => $orderId,
                    'discount_amount' => $usage->discount_amount,
                ]);

                // Delete usage record
                $usage->delete();
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
