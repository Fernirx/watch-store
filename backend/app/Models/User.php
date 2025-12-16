<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'phone',
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

    // Relationship với Favorites
    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    // Relationship để lấy danh sách sản phẩm yêu thích
    public function favoriteProducts()
    {
        return $this->belongsToMany(Product::class, 'favorites')
            ->withTimestamps();
    }

    // Relationship với Wishlist
    public function wishlist()
    {
        return $this->hasOne(Wishlist::class);
    }

    // Relationship với Addresses
    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    // Lấy địa chỉ mặc định
    public function defaultAddress()
    {
        return $this->hasOne(Address::class)->where('is_default', true);
    }
}
