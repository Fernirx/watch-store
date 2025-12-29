<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'email_verified_at',
        'avatar_url',
        'provider',
        'provider_id',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'provider_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    protected $attributes = [
        'provider' => 'LOCAL',
        'role' => 'USER',
        'is_active' => true,
    ];

    // Relationship với Customer
    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    // Relationship với Wishlist
    public function wishlist()
    {
        return $this->hasOne(Wishlist::class);
    }

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'email' => $this->email,
            'role' => $this->role,
        ];
    }
}
