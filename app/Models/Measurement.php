<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Measurement extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'code',
        'measurement',
        'tol_plus',
        'tol_minus',
    ];

    protected $casts = [
        'tol_plus' => 'decimal:2',
        'tol_minus' => 'decimal:2',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function sizes(): HasMany
    {
        return $this->hasMany(MeasurementSize::class);
    }
}
