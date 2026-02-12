<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UploadedAnnotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'article_style',
        'size',
        'side',
        'name',
        'annotation_data',
        'reference_image_path',
        'reference_image_data',
        'reference_image_filename',
        'reference_image_mime_type',
        'reference_image_size',
        'image_width',
        'image_height',
        'original_json_filename',
        'api_image_url',
        'upload_source',
        'annotation_date',
    ];

    protected $casts = [
        'annotation_data' => 'array',
        'annotation_date' => 'datetime',
        'image_width' => 'integer',
        'image_height' => 'integer',
        'reference_image_size' => 'integer',
    ];

    /**
     * Get the article that owns this annotation.
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * Get the full storage path for the reference image.
     */
    public function getStoragePath(): ?string
    {
        if (!$this->reference_image_path) {
            return null;
        }
        return storage_path('app/public/' . $this->reference_image_path);
    }

    /**
     * Get the public URL for the reference image.
     */
    public function getPublicUrl(): ?string
    {
        if (!$this->reference_image_path) {
            return null;
        }
        return asset('storage/' . $this->reference_image_path);
    }

    /**
     * Get keypoints from annotation data.
     */
    public function getKeypoints(): array
    {
        return $this->annotation_data['keypoints'] ?? [];
    }

    /**
     * Get target distances from annotation data.
     */
    public function getTargetDistances(): array
    {
        return $this->annotation_data['target_distances'] ?? [];
    }

    /**
     * Get placement box from annotation data.
     */
    public function getPlacementBox(): array
    {
        return $this->annotation_data['placement_box'] ?? [];
    }

    /**
     * Find annotation by article style, size, and side.
     */
    public static function findByStyleAndSize(string $articleStyle, string $size, string $side = 'front'): ?self
    {
        return self::where('article_style', $articleStyle)
            ->where('size', $size)
            ->where('side', $side)
            ->first();
    }

    /**
     * Find annotation by article ID, size, and side.
     */
    public static function findByArticleIdAndSize(int $articleId, string $size, string $side = 'front'): ?self
    {
        return self::where('article_id', $articleId)
            ->where('size', $size)
            ->where('side', $side)
            ->first();
    }

    /**
     * Get all annotations for Electron app.
     */
    public static function getAllForElectron(): array
    {
        return self::with('article.brand')->get()->map(function ($annotation) {
            return [
                'id' => $annotation->id,
                'article_id' => $annotation->article_id,
                'article_style' => $annotation->article_style,
                'brand_name' => $annotation->article?->brand?->name,
                'size' => $annotation->size,
                'name' => $annotation->name,
                'annotation_data' => $annotation->annotation_data,
                'reference_image_url' => $annotation->api_image_url,
                'image_width' => $annotation->image_width,
                'image_height' => $annotation->image_height,
                'annotation_date' => $annotation->annotation_date?->toIso8601String(),
                'created_at' => $annotation->created_at->toIso8601String(),
                'updated_at' => $annotation->updated_at->toIso8601String(),
            ];
        })->toArray();
    }
}
