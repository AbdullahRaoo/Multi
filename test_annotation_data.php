<?php

/**
 * Quick test script to verify annotation data structure
 * Run: php test_annotation_data.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ArticleAnnotation;

echo "=== Testing Annotation Data Structure ===\n\n";

// Get the most recent annotation
$annotation = ArticleAnnotation::latest()->first();

if (!$annotation) {
    echo "No annotations found in database.\n";
    echo "Please create an annotation first via the dashboard.\n";
    exit(0);
}

echo "Found annotation: {$annotation->name}\n";
echo "Article Style: {$annotation->article_style}\n";
echo "Size: {$annotation->size}\n";
echo "Created: {$annotation->created_at}\n\n";

echo "--- Resolution Data ---\n";
echo "Image Width: {$annotation->image_width}\n";
echo "Image Height: {$annotation->image_height}\n";
echo "Native Width: {$annotation->native_width}\n";
echo "Native Height: {$annotation->native_height}\n";
echo "Capture Source: {$annotation->capture_source}\n\n";

echo "--- Annotation Points ---\n";
echo "Number of points: " . count($annotation->annotations ?? []) . "\n";
if ($annotation->annotations) {
    foreach ($annotation->annotations as $index => $point) {
        echo "Point " . ($index + 1) . ": ";
        echo "x={$point['x']}%, y={$point['y']}%, label={$point['label']}\n";
    }
}
echo "\n";

echo "--- Target Distances ---\n";
if ($annotation->target_distances && count($annotation->target_distances) > 0) {
    echo "Number of measurement pairs: " . count($annotation->target_distances) . "\n";
    foreach ($annotation->target_distances as $pairNum => $distance) {
        echo "Pair {$pairNum}: {$distance} cm\n";
    }
} else {
    echo "❌ No target distances saved!\n";
    echo "This is the issue - target distances should be here.\n";
}
echo "\n";

echo "--- Keypoints (Scaled to Native Resolution) ---\n";
if ($annotation->keypoints_pixels) {
    echo "Number of keypoints: " . count($annotation->keypoints_pixels) . "\n";
    foreach ($annotation->keypoints_pixels as $index => $point) {
        echo "Keypoint " . ($index + 1) . ": [{$point[0]}, {$point[1]}] px\n";
    }
} else {
    echo "No keypoints found.\n";
}
echo "\n";

echo "--- JSON Export Format ---\n";
$exportData = $annotation->getMeasurementSystemFormat();
echo json_encode($exportData, JSON_PRETTY_PRINT);
echo "\n\n";

echo "=== Test Complete ===\n";
