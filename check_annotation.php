<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$annotation = \App\Models\ArticleAnnotation::latest()->first();

if ($annotation) {
    echo "=== LATEST ANNOTATION FROM DASHBOARD ===\n\n";
    echo json_encode([
        'keypoints_pixels' => $annotation->keypoints_pixels,
        'target_distances' => $annotation->target_distances,
        'image_width' => $annotation->image_width,
        'image_height' => $annotation->image_height,
        'article_style' => $annotation->article_style,
        'size' => $annotation->size,
        'created_at' => $annotation->created_at->toIso8601String(),
    ], JSON_PRETTY_PRINT);
    echo "\n";
} else {
    echo "No annotations found.\n";
}

// Also check calibration
$calibration = \App\Models\CameraCalibration::getActive();
if ($calibration) {
    echo "\n=== ACTIVE CALIBRATION ===\n\n";
    echo json_encode([
        'name' => $calibration->name,
        'pixels_per_cm' => $calibration->pixels_per_cm,
        'reference_length_cm' => $calibration->reference_length_cm,
        'pixel_distance' => $calibration->pixel_distance,
    ], JSON_PRETTY_PRINT);
    echo "\n";
}
