<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransaction extends Model
{
    protected $fillable = [
        'type',
        'product_id',
        'supplier_id',
        'quantity',
        'unit_price',
        'reference_type',
        'reference_id',
        'performed_by',
        'notes',
        'transaction_date',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'transaction_date' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Scope for import transactions
     */
    public function scopeImports($query)
    {
        return $query->where('type', 'IMPORT');
    }

    /**
     * Scope for export transactions
     */
    public function scopeExports($query)
    {
        return $query->where('type', 'EXPORT');
    }
}
