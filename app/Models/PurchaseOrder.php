<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'po_number',
        'date',
        'brand_id',
        'country',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(PurchaseOrderArticle::class);
    }

    public function clientReferences(): HasMany
    {
        return $this->hasMany(PurchaseOrderClientReference::class);
    }
}
