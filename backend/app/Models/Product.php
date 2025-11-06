<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'description',
        'price',
        'sale_price',
        'sku',
        'stock_quantity',
        'images',
        'specifications',
        'case_material',
        'strap_material',
        'movement_type',
        'water_resistance',
        'dial_color',
        'case_diameter',
        'gender',
        'is_featured',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:0',
        'sale_price' => 'decimal:0',
        'stock_quantity' => 'integer',
        'images' => 'array',
        'specifications' => 'array',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'discount_percentage',
        'in_stock',
        'image_url',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function getDiscountPercentageAttribute()
    {
        if ($this->sale_price && $this->price > 0) {
            return round((($this->price - $this->sale_price) / $this->price) * 100);
        }
        return 0;
    }

    public function getInStockAttribute()
    {
        return $this->stock_quantity > 0;
    }

    public function getImageUrlAttribute()
    {
        if ($this->images && is_array($this->images) && count($this->images) > 0) {
            return $this->images[0]['url'] ?? null;
        }
        return null;
    }
}
