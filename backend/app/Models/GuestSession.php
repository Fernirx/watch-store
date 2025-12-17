<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class GuestSession extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'guest_token',
        'created_at',
        'last_active',
        'expires_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'last_active' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Generate unique guest token
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (self::where('guest_token', $token)->exists());

        return $token;
    }

    /**
     * Create new guest session
     */
    public static function createSession(): self
    {
        return self::create([
            'guest_token' => self::generateToken(),
            'created_at' => now(),
            'last_active' => now(),
            'expires_at' => now()->addDays(30), // 30 ngày
        ]);
    }

    /**
     * Update last active time
     */
    public function updateLastActive(): void
    {
        $this->update(['last_active' => now()]);
    }

    /**
     * Check if session is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Relationship: Guest session has one cart
     */
    public function cart()
    {
        return $this->hasOne(Cart::class, 'guest_token', 'guest_token');
    }

    /**
     * Relationship: Guest session has many orders
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'guest_token', 'guest_token');
    }
}
