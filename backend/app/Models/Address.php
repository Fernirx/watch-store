<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'recipient_name',
        'phone',
        'street',
        'ward',
        'city',
        'postal_code',
        'country',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    protected $attributes = [
        'country' => 'Việt Nam',
        'is_default' => false,
    ];

    // Relationship với User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}