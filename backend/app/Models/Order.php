<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
        'customer_name',
        'customer_email',
        'order_number',
        'status',
        'subtotal',
        'shipping_fee',
        'total',
        'payment_method',
        'payment_status',
        'shipping_address',
        'shipping_phone',
        'coupon_id',
        'coupon_code',
        'discount_amount',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'discount_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function couponUsage(): HasOne
    {
        return $this->hasOne(CouponUsage::class);
    }
}
