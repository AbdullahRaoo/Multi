<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleAnnotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'article_image_id',
        'article_style',
        'size',
        'name',
        'annotations',
        'target_distances',
        'placement_box',
        'keypoints_pixels',
        'image_width',
        'image_height',
        'native_width',
        'native_height',
        'capture_source',
        'capture_width',
        'capture_height',
        'reference_image_path',
        'image_data',
        'image_mime_type',
        'json_file_path',
    ];

    protected $casts = [
        'annotations' => 'array',
        'target_distances' => 'array',
        'placement_box' => 'array',
        'keypoints_pixels' => 'array',
    ];

    /**
     * Get the image as a data URL for direct rendering.
     */
    public function getImageDataUrl(): ?string
    {
        if ($this->image_data && $this->image_mime_type) {
            return 'data:' . $this->image_mime_type . ';base64,' . $this->image_data;
        }
        return null;
    }

    /**
     * Get annotation data in Python measurement system format.
     * This is the EXACT format expected by measurment2.py
     * 
     * Format:
     * {
     *   "keypoints": [[x1, y1], [x2, y2], ...],
     *   "target_distances": {1: value, 2: value, ...},
     *   "placement_box": [x1, y1, x2, y2],
     *   "annotation_date": "ISO8601"
     * }
     */
    public function getMeasurementSystemFormat(): array
    {
        // Get keypoints in [[x,y], [x,y], ...] format
        $keypoints = $this->keypoints_pixels ?? $this->convertAnnotationsToPixels();
        
        // Ensure target_distances has INTEGER keys (not strings)
        // Python expects: {1: value, 2: value, ...}
        $targetDistances = [];
        if ($this->target_distances) {
            foreach ($this->target_distances as $key => $value) {
                $targetDistances[(int)$key] = (float)$value;
            }
        }
        
        // Get placement box in [x1, y1, x2, y2] format
        $placementBox = $this->placement_box ?? [];
        
        return [
            'keypoints' => $keypoints,
            'target_distances' => $targetDistances,
            'placement_box' => $placementBox,
            'annotation_date' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Convert percentage-based annotations to pixel coordinates.
     * Used when keypoints_pixels is not set.
     */
    public function convertAnnotationsToPixels(): array
    {
        if (!$this->annotations || !$this->image_width || !$this->image_height) {
            return [];
        }

        $pixels = [];
        foreach ($this->annotations as $point) {
            // Convert percentage (0-100) to pixel coordinates
            $x = (int) round(($point['x'] / 100) * $this->image_width);
            $y = (int) round(($point['y'] / 100) * $this->image_height);
            $pixels[] = [$x, $y];
        }
        return $pixels;
    }

    /**
     * Convert pixel coordinates to percentage-based annotations.
     */
    public static function convertPixelsToAnnotations(array $pixels, int $width, int $height, array $labels = []): array
    {
        $annotations = [];
        foreach ($pixels as $i => $point) {
            $annotations[] = [
                'x' => round(($point[0] / $width) * 100, 2),
                'y' => round(($point[1] / $height) * 100, 2),
                'label' => $labels[$i] ?? 'Point ' . ($i + 1),
            ];
        }
        return $annotations;
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function articleImage(): BelongsTo
    {
        return $this->belongsTo(ArticleImage::class);
    }
}
