<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeasurementSize extends Model
{
    use HasFactory;

    protected $fillable = [
        'measurement_id',
        'size',
        'value',
        'unit',
    ];

    protected $casts = [
        'value' => 'decimal:2',
    ];

    public function measurement(): BelongsTo
    {
        return $this->belongsTo(Measurement::class);
    }
}
