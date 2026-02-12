<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'article_style',
        'size',
        'image_path',
        'image_name',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
