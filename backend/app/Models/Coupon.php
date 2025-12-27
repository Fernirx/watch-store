<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'max_discount',
        'min_order_value',
        'usage_type',
        'usage_limit',
        'usage_count',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'min_order_value' => 'decimal:2',
        'usage_limit' => 'integer',
        'usage_count' => 'integer',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Check if coupon is currently valid (active and within date range)
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();

        if ($this->valid_from && $now->lt($this->valid_from)) {
            return false;
        }

        if ($this->valid_until && $now->gt($this->valid_until)) {
            return false;
        }

        return true;
    }

    /**
     * Check if usage limit has been reached
     */
    public function hasReachedLimit(): bool
    {
        if ($this->usage_type === 'SINGLE_USE') {
            return $this->usage_count > 0;
        }

        if ($this->usage_type === 'LIMITED_USE' && $this->usage_limit) {
            return $this->usage_count >= $this->usage_limit;
        }

        return false;
    }

    /**
     * Calculate discount amount for given subtotal
     */
    public function calculateDiscount(float $subtotal): float
    {
        if ($this->discount_type === 'PERCENTAGE') {
            $discount = ($subtotal * $this->discount_value) / 100;

            // Apply max discount cap if set
            if ($this->max_discount && $discount > $this->max_discount) {
                $discount = (float) $this->max_discount;
            }

            return round($discount, 2);
        }

        // FIXED type - don't exceed subtotal
        return min((float) $this->discount_value, $subtotal);
    }
}
