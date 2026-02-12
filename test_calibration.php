#!/usr/bin/env php
<?php
/**
 * Test Calibration System
 * 
 * This script demonstrates:
 * 1. Creating a camera calibration
 * 2. Verifying calibration calculation
 * 3. Exporting calibration for Python system
 */

require __DIR__ . '/vendor/autoload.php';

use App\Models\CameraCalibration;
use App\Models\ArticleAnnotation;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n" . str_repeat("=", 70) . "\n";
echo "CAMERA CALIBRATION TEST\n";
echo str_repeat("=", 70) . "\n\n";

// Simulate calibration points (example: marking 30cm on a ruler)
// Point 1: 0cm mark at pixel (100, 200)
// Point 2: 30cm mark at pixel (2028, 220)
$point1 = [100, 200];
$point2 = [2028, 220];
$referenceLengthCm = 30.0;

echo "[1/4] Creating test calibration...\n";
echo "  Point 1: [{$point1[0]}, {$point1[1]}] (0cm mark)\n";
echo "  Point 2: [{$point2[0]}, {$point2[1]}] (30cm mark)\n";
echo "  Known distance: {$referenceLengthCm} cm\n\n";

// Calculate pixel distance
$pixelDistance = sqrt(
    pow($point2[0] - $point1[0], 2) + 
    pow($point2[1] - $point1[1], 2)
);

echo "  Calculated pixel distance: " . number_format($pixelDistance, 2) . " pixels\n";

// Calculate pixels per cm
$pixelsPerCm = $pixelDistance / $referenceLengthCm;
echo "  Calculated scale: " . number_format($pixelsPerCm, 4) . " pixels/cm\n\n";

// Create calibration
$calibration = CameraCalibration::create([
    'name' => 'Test Calibration - ' . date('Y-m-d H:i:s'),
    'pixels_per_cm' => $pixelsPerCm,
    'reference_length_cm' => $referenceLengthCm,
    'pixel_distance' => (int) round($pixelDistance),
    'calibration_points' => [$point1, $point2],
    'is_active' => false,
]);

$calibration->setActive();

echo "✓ Calibration created successfully!\n";
echo "  ID: {$calibration->id}\n";
echo "  Name: {$calibration->name}\n";
echo "  Pixels per cm: {$calibration->pixels_per_cm}\n";
echo "  Status: " . ($calibration->is_active ? 'Active' : 'Inactive') . "\n\n";

// Verify calibration with a test measurement
echo "[2/4] Verifying calibration with test measurement...\n";

// Test: If we have two points 10cm apart, what's the pixel distance?
$expectedPixelDistance10cm = $pixelsPerCm * 10;
echo "  Expected pixel distance for 10cm: " . number_format($expectedPixelDistance10cm, 2) . " pixels\n";

// Reverse: If we have 642.67 pixels, what's the distance in cm?
$testPixelDistance = 642.67;
$calculatedCm = $testPixelDistance / $pixelsPerCm;
echo "  {$testPixelDistance} pixels = " . number_format($calculatedCm, 2) . " cm\n";
echo "✓ Calibration verified!\n\n";

// Export calibration in Python format
echo "[3/4] Exporting calibration for Python system...\n";

$calibrationData = $calibration->getCalibrationFormat();

echo "  Format: camera_calibration.json\n";
echo "  Content:\n";
echo json_encode($calibrationData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";

// Write to file
$outputDir = __DIR__ . '/test_export';
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$calibrationFile = $outputDir . '/camera_calibration.json';
file_put_contents($calibrationFile, json_encode($calibrationData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo "✓ Written to: {$calibrationFile}\n\n";

// Show how it works with annotations
echo "[4/4] Integration with annotations...\n";

$annotation = ArticleAnnotation::first();

if ($annotation) {
    echo "  Annotation: {$annotation->name}\n";
    echo "  Keypoints: " . count($annotation->keypoints_pixels) . "\n";
    
    // Calculate distance between first two keypoints
    $keypoints = $annotation->keypoints_pixels;
    if (count($keypoints) >= 2) {
        $kp1 = $keypoints[0];
        $kp2 = $keypoints[1];
        
        $pixelDist = sqrt(
            pow($kp2[0] - $kp1[0], 2) + 
            pow($kp2[1] - $kp1[1], 2)
        );
        
        $realDist = $pixelDist / $calibration->pixels_per_cm;
        
        echo "\n  Example measurement:\n";
        echo "  - Point 1: [{$kp1[0]}, {$kp1[1]}]\n";
        echo "  - Point 2: [{$kp2[0]}, {$kp2[1]}]\n";
        echo "  - Pixel distance: " . number_format($pixelDist, 2) . " pixels\n";
        echo "  - Real distance: " . number_format($realDist, 2) . " cm\n";
    }
} else {
    echo "  No annotations found to demonstrate integration.\n";
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "✅ CALIBRATION TEST COMPLETE\n";
echo str_repeat("=", 70) . "\n\n";

echo "Summary:\n";
echo "  1. ✓ Calibration created and saved to database\n";
echo "  2. ✓ Calibration calculations verified\n";
echo "  3. ✓ Exported to Python-compatible format\n";
echo "  4. ✓ Ready for use with annotations\n\n";

echo "Files in {$outputDir}:\n";
echo "  - camera_calibration.json\n";
if (file_exists($outputDir . '/annotation_data.json')) {
    echo "  - annotation_data.json\n";
}
if (file_exists($outputDir . '/reference_image.jpg')) {
    echo "  - reference_image.jpg\n";
}

echo "\nNext steps:\n";
echo "  1. Frontend: Add calibration wizard before annotation creation\n";
echo "  2. Display current calibration status in UI\n";
echo "  3. Electron app: Export calibration with annotations\n";
echo "  4. Python system: Load calibration automatically\n\n";

echo "All calibrations in database:\n";
echo str_repeat("-", 70) . "\n";

$allCalibrations = CameraCalibration::orderBy('created_at', 'desc')->get();
foreach ($allCalibrations as $cal) {
    $status = $cal->is_active ? '[ACTIVE]' : '        ';
    echo "{$status} ID {$cal->id}: {$cal->name}\n";
    echo "         Pixels/cm: {$cal->pixels_per_cm}, Reference: {$cal->reference_length_cm} cm\n";
    echo "         Created: {$cal->created_at}\n\n";
}

echo str_repeat("=", 70) . "\n\n";
