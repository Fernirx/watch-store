<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CouponUsage extends Model
{
    protected $table = 'coupon_usage';

    protected $fillable = [
        'coupon_id',
        'order_id',
        'user_id',
        'guest_token',
        'email',
        'phone',
        'discount_amount',
        'used_at',
    ];

    protected $casts = [
        'discount_amount' => 'decimal:2',
        'used_at' => 'datetime',
    ];

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
