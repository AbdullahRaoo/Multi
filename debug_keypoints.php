<?php
/**
 * Debug: Trace the keypoint conversion process
 * This simulates what the backend does with the frontend percentage coordinates
 */

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== KEYPOINT CONVERSION DEBUG ===\n\n";

// Get the latest annotation to see what was stored
$annotation = \App\Models\ArticleAnnotation::latest()->first();

// Also get the raw annotations (percentage-based) from the database
$rawAnnotations = $annotation->annotations; // This should be the original percentage data

echo "--- Stored Raw Annotations (percentages) ---\n";
if ($rawAnnotations) {
    foreach ($rawAnnotations as $i => $point) {
        $num = $i + 1;
        $x = isset($point['x']) ? $point['x'] : 'N/A';
        $y = isset($point['y']) ? $point['y'] : 'N/A';
        echo "Point $num: x=" . (is_numeric($x) ? round($x, 2) : $x) . "%, y=" . (is_numeric($y) ? round($y, 2) : $y) . "%\n";
    }
} else {
    echo "No raw annotations found in database.\n";
}

echo "\n--- Stored Native Keypoints ---\n";
$storedKeypoints = $annotation->keypoints_pixels;
foreach ($storedKeypoints as $i => $point) {
    $num = $i + 1;
    echo "Point $num: [{$point[0]}, {$point[1]}]\n";
}

echo "\n--- Expected Native Keypoints (from Python) ---\n";
$expectedKeypoints = [
    [1806, 1318], [1710, 2024], [3395, 1359], [3465, 2045],
    [2280, 1144], [2895, 1173], [1809, 2924], [3308, 2945],
    [2268, 1062], [2225, 3073], [229, 1917], [323, 2135],
    [3410, 1285], [4849, 2061]
];
foreach ($expectedKeypoints as $i => $point) {
    $num = $i + 1;
    echo "Point $num: [{$point[0]}, {$point[1]}]\n";
}

echo "\n--- Conversion Verification ---\n";
echo "Native resolution: 5488 x 3672\n";
echo "Webcam resolution: 1920 x 1080\n\n";

// Let's verify the conversion is correct
// If we convert the expected native keypoints back to percentages:
echo "Converting Expected Native → Percentage:\n";
$nativeW = 5488;
$nativeH = 3672;
$webcamW = 1920;
$webcamH = 1080;

foreach ($expectedKeypoints as $i => $native) {
    $num = $i + 1;
    // Native → Webcam → Percentage
    $webcamX = $native[0] * ($webcamW / $nativeW);
    $webcamY = $native[1] * ($webcamH / $nativeH);
    $percentX = ($webcamX / $webcamW) * 100;
    $percentY = ($webcamY / $webcamH) * 100;
    
    echo "Point $num: Native [{$native[0]}, {$native[1]}] → " . 
         "Webcam [" . round($webcamX, 1) . ", " . round($webcamY, 1) . "] → " .
         "Percent [" . round($percentX, 2) . "%, " . round($percentY, 2) . "%]\n";
}

echo "\n--- Comparing raw annotations with expected percentages ---\n";
if ($rawAnnotations) {
    for ($i = 0; $i < min(count($rawAnnotations), count($expectedKeypoints)); $i++) {
        $num = $i + 1;
        $rawX = $rawAnnotations[$i]['x'] ?? 0;
        $rawY = $rawAnnotations[$i]['y'] ?? 0;
        
        // Expected percentage
        $native = $expectedKeypoints[$i];
        $expectedPctX = ($native[0] / $nativeW) * 100;
        $expectedPctY = ($native[1] / $nativeH) * 100;
        
        $diffX = abs($rawX - $expectedPctX);
        $diffY = abs($rawY - $expectedPctY);
        
        $match = ($diffX < 1 && $diffY < 1) ? "✅" : "❌";
        
        echo "P$num: Raw [" . round($rawX, 2) . "%, " . round($rawY, 2) . "%] vs " .
             "Expected [" . round($expectedPctX, 2) . "%, " . round($expectedPctY, 2) . "%] " .
             "Diff: [" . round($diffX, 2) . "%, " . round($diffY, 2) . "%] $match\n";
    }
}

echo "\n--- Capture dimensions stored ---\n";
echo "capture_width: " . ($annotation->capture_width ?? 'NULL') . "\n";
echo "capture_height: " . ($annotation->capture_height ?? 'NULL') . "\n";
echo "image_width: " . ($annotation->image_width ?? 'NULL') . "\n";
echo "image_height: " . ($annotation->image_height ?? 'NULL') . "\n";
