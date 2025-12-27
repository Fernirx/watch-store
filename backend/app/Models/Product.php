<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        // Foreign Keys
        'category_id',
        'brand_id',
        'supplier_id',

        // Basic Information
        'code',
        'name',
        'slug',
        'description',

        // Pricing
        'price',
        'original_price',
        'cost_price',

        // Inventory Management
        'stock_quantity',
        'min_stock_level',
        'reorder_point',

        // Product Details
        'warranty_period',
        'origin_country',
        'gender',

        // Movement (Bộ máy)
        'movement_type',
        'movement_name',
        'power_reserve',

        // Materials (Chất liệu)
        'case_material',
        'strap_material',
        'glass_material',

        // Colors
        'dial_color',
        'case_color',
        'strap_color',

        // Water Resistance
        'water_resistance',

        // Battery
        'battery_type',
        'battery_voltage',

        // Technical Specifications
        'case_size',
        'case_thickness',
        'weight',

        // Features & Images
        'features',
        'images',
        'specifications',

        // Status & Badges
        'is_new',
        'is_on_sale',
        'is_featured',
        'is_active',

        // Statistics
        'sold_count',
        'view_count',

        // Reviews
        'average_rating',
        'review_count',
    ];

    protected $casts = [
        // Pricing
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'cost_price' => 'decimal:2',

        // Inventory
        'stock_quantity' => 'integer',
        'min_stock_level' => 'integer',
        'reorder_point' => 'integer',

        // Technical Specs
        'case_size' => 'decimal:2',
        'case_thickness' => 'decimal:2',
        'weight' => 'decimal:2',

        // JSON fields
        'images' => 'array',
        'features' => 'array',
        'specifications' => 'array',

        // Booleans
        'is_new' => 'boolean',
        'is_on_sale' => 'boolean',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',

        // Statistics
        'sold_count' => 'integer',
        'view_count' => 'integer',

        // Reviews
        'average_rating' => 'decimal:2',
        'review_count' => 'integer',
    ];

    protected $appends = [
        'discount_percentage',
        'in_stock',
        'image_url',
        'primary_image',
        'formatted_price',
        'formatted_original_price',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockTransactions()
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class)->orderBy('created_at', 'desc');
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoritedByUsers()
    {
        return $this->belongsToMany(User::class, 'favorites')
            ->withTimestamps();
    }

    // Accessors (Computed Attributes)
    public function getDiscountPercentageAttribute()
    {
        if ($this->original_price && $this->price > 0 && $this->original_price > $this->price) {
            return round((($this->original_price - $this->price) / $this->original_price) * 100);
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
            return $this->images[0]['url'] ?? $this->images[0] ?? null;
        }
        return null;
    }

    public function getPrimaryImageAttribute()
    {
        if ($this->images && is_array($this->images)) {
            // Tìm ảnh primary
            foreach ($this->images as $image) {
                if (is_array($image) && isset($image['is_primary']) && $image['is_primary']) {
                    return $image['url'] ?? $image;
                }
            }
            // Nếu không có primary, lấy ảnh đầu tiên
            return $this->images[0]['url'] ?? $this->images[0] ?? null;
        }
        return null;
    }

    public function getFormattedPriceAttribute()
    {
        return number_format($this->price, 0, ',', '.') . ' ₫';
    }

    public function getFormattedOriginalPriceAttribute()
    {
        if ($this->original_price) {
            return number_format($this->original_price, 0, ',', '.') . ' ₫';
        }
        return null;
    }

    // Mutators (Set Attributes)
    public function setNameAttribute($value)
    {
        $this->attributes['name'] = $value;
        // Auto-generate slug nếu chưa có
        if (empty($this->attributes['slug'])) {
            $this->attributes['slug'] = Str::slug($value);
        }
    }

    // Scopes (Query Helpers)
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeOnSale($query)
    {
        return $query->where('is_on_sale', true);
    }

    public function scopeNewProducts($query)
    {
        return $query->where('is_new', true);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock_quantity', '<=', 'min_stock_level');
    }
}
