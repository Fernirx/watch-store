<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guestSession(): BelongsTo
    {
        return $this->belongsTo(GuestSession::class, 'guest_token', 'guest_token');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Check if cart belongs to a guest
     */
    public function isGuest(): bool
    {
        return $this->user_id === null && $this->guest_token !== null;
    }

    /**
     * Check if cart belongs to an authenticated user
     */
    public function isUser(): bool
    {
        return $this->user_id !== null;
    }
}
