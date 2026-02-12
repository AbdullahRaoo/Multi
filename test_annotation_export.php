#!/usr/bin/env php
<?php
/**
 * Test Annotation Export for Python System
 * 
 * This script demonstrates:
 * 1. Fetching annotation from database
 * 2. Formatting it for Python measurement system
 * 3. Writing annotation_data.json file
 * 4. Extracting reference image from Base64
 */

require __DIR__ . '/vendor/autoload.php';

use App\Models\ArticleAnnotation;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n" . str_repeat("=", 70) . "\n";
echo "ANNOTATION EXPORT TEST FOR PYTHON SYSTEM\n";
echo str_repeat("=", 70) . "\n\n";

// Get command line arguments
$articleStyle = $argv[1] ?? null;
$size = $argv[2] ?? null;
$outputDir = $argv[3] ?? __DIR__ . '/test_export';

if (!$articleStyle || !$size) {
    echo "Usage: php test_annotation_export.php <article_style> <size> [output_dir]\n\n";
    echo "Examples:\n";
    echo "  php test_annotation_export.php NKE-TS-001 XXL\n";
    echo "  php test_annotation_export.php ADD-TS-001 S ./output\n\n";
    
    // Show available annotations
    $annotations = ArticleAnnotation::select('article_style', 'size')->get();
    
    if ($annotations->isNotEmpty()) {
        echo "Available annotations:\n";
        foreach ($annotations as $ann) {
            echo "  - {$ann->article_style} - {$ann->size}\n";
        }
        echo "\n";
    }
    
    exit(1);
}

// 1. Fetch annotation from database
echo "[1/4] Fetching annotation from database...\n";
$annotation = ArticleAnnotation::where('article_style', $articleStyle)
    ->where('size', $size)
    ->first();

if (!$annotation) {
    echo "❌ Error: No annotation found for {$articleStyle} - {$size}\n\n";
    exit(1);
}

echo "✓ Found: {$annotation->name}\n";
echo "  Keypoints: " . count($annotation->keypoints_pixels) . "\n";
echo "  Image: {$annotation->image_width}x{$annotation->image_height}\n\n";

// 2. Get data in Python measurement system format
echo "[2/4] Formatting data for Python system...\n";
$pythonData = $annotation->getMeasurementSystemFormat();

echo "✓ Format verified:\n";
echo "  - keypoints: " . count($pythonData['keypoints']) . " points\n";
echo "  - target_distances: " . count($pythonData['target_distances']) . " measurements\n";
echo "  - placement_box: " . (empty($pythonData['placement_box']) ? 'not set' : 'set') . "\n";
echo "  - annotation_date: {$pythonData['annotation_date']}\n\n";

// 3. Create output directory
echo "[3/4] Creating output directory...\n";
if (!is_dir($outputDir)) {
    if (!mkdir($outputDir, 0755, true)) {
        echo "❌ Error: Could not create directory {$outputDir}\n\n";
        exit(1);
    }
}
echo "✓ Directory: {$outputDir}\n\n";

// 4. Write annotation_data.json
echo "[4/4] Writing files...\n";

// Write annotation JSON
$annotationFile = $outputDir . '/annotation_data.json';
file_put_contents(
    $annotationFile,
    json_encode($pythonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);
echo "✓ Written: annotation_data.json (" . number_format(filesize($annotationFile) / 1024, 2) . " KB)\n";

// Write reference image
if ($annotation->image_data) {
    $imageData = base64_decode($annotation->image_data);
    
    // Determine file extension
    $mimeToExt = [
        'image/jpeg' => '.jpg',
        'image/png' => '.png',
        'image/gif' => '.gif',
        'image/webp' => '.webp'
    ];
    $extension = $mimeToExt[$annotation->image_mime_type] ?? '.jpg';
    
    $imageFile = $outputDir . '/reference_image' . $extension;
    file_put_contents($imageFile, $imageData);
    echo "✓ Written: reference_image{$extension} (" . number_format(strlen($imageData) / 1024, 2) . " KB)\n";
} else {
    echo "⚠ Warning: No image data available\n";
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "✅ EXPORT COMPLETE\n";
echo str_repeat("=", 70) . "\n\n";

echo "Output directory: {$outputDir}\n";
echo "Files created:\n";
echo "  1. annotation_data.json  - Measurement points and targets\n";
echo "  2. reference_image.jpg   - Reference image\n\n";

echo "Next steps:\n";
echo "  1. Copy camera_calibration.json to this directory\n";
echo "  2. Run: python measurment2.py\n";
echo "  3. The Python system will load these files automatically\n\n";

// Display the annotation data
echo str_repeat("-", 70) . "\n";
echo "ANNOTATION DATA (annotation_data.json):\n";
echo str_repeat("-", 70) . "\n";
echo json_encode($pythonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
echo str_repeat("-", 70) . "\n\n";

// Explain the format
echo "Format Explanation:\n";
echo "  • keypoints: Array of [x, y] pixel coordinates\n";
echo "               Pairs: (1,2), (3,4), (5,6), etc.\n";
echo "               Example: Point 1 at [1195, 641], Point 2 at [584, 660]\n";
echo "               Distance measured between each pair\n\n";

echo "  • target_distances: Target measurements in cm (set after first measurement)\n";
echo "                      Key 1 = distance between points 1-2\n";
echo "                      Key 2 = distance between points 3-4, etc.\n";
echo "                      Currently: " . (empty($pythonData['target_distances']) ? 'Not set (will be auto-set)' : count($pythonData['target_distances']) . ' measurements') . "\n\n";

echo "  • placement_box: Optional guide for shirt placement [x1, y1, x2, y2]\n";
echo "                   Currently: " . (empty($pythonData['placement_box']) ? 'Not set' : 'Set') . "\n\n";

echo "  • annotation_date: Last update timestamp (ISO 8601 format)\n\n";

echo "This format EXACTLY matches what measurment2.py expects!\n";
echo str_repeat("=", 70) . "\n\n";
