<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderClientReference extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'reference_name',
        'reference_number',
        'reference_email_address',
        'email_subject',
        'email_date',
    ];

    protected $casts = [
        'email_date' => 'date',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
