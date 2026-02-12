<?php
/**
 * Verify the target distance calculation
 * Comparing dashboard output vs expected Python output
 */

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TARGET DISTANCE VERIFICATION ===\n\n";

// Expected from Python system
$expectedKeypoints = [
    [1806, 1318],
    [1710, 2024],
    [3395, 1359],
    [3465, 2045],
    [2280, 1144],
    [2895, 1173],
    [1809, 2924],
    [3308, 2945],
    [2268, 1062],
    [2225, 3073],
    [229, 1917],
    [323, 2135],
    [3410, 1285],
    [4849, 2061]
];

$expectedDistances = [
    1 => 20.8524686252755,
    2 => 20.181240578402498,
    3 => 18.019047989259654,
    4 => 43.87601480642671,
    5 => 58.90287103526992,
    6 => 6.9748861675833,
    7 => 47.87395450078443
];

// Calculate what pixels_per_cm was used in the Python system
echo "--- Back-calculating Python's pixels_per_cm ---\n";
for ($i = 0; $i < count($expectedKeypoints) - 1; $i += 2) {
    $p1 = $expectedKeypoints[$i];
    $p2 = $expectedKeypoints[$i + 1];
    $pairNum = ($i / 2) + 1;
    
    $pixelDist = sqrt(pow($p2[0] - $p1[0], 2) + pow($p2[1] - $p1[1], 2));
    $expectedDist = $expectedDistances[$pairNum];
    $impliedPxPerCm = $pixelDist / $expectedDist;
    
    echo "Pair $pairNum: pixel_dist = " . round($pixelDist, 2) . " px, target = $expectedDist cm\n";
    echo "         => pixels_per_cm = " . round($impliedPxPerCm, 4) . " (at native 5488x3672)\n";
}

echo "\n--- Current Dashboard Calibration ---\n";
$cal = \App\Models\CameraCalibration::getActive();
echo "pixels_per_cm (webcam): " . $cal->pixels_per_cm . "\n";
echo "pixels_per_cm (native): " . round($cal->pixels_per_cm * (5488/1920), 4) . "\n";

echo "\n--- What dashboard WOULD calculate for expected keypoints ---\n";
// Simulate dashboard calculation
// Dashboard uses webcam-resolution keypoints for distance calc
// So we need to convert native keypoints back to webcam

$nativeW = 5488;
$nativeH = 3672;
$webcamW = 1920;
$webcamH = 1080;

$scaleToWebcam = $webcamW / $nativeW;
$pixelsPerCm = $cal->pixels_per_cm; // at webcam resolution

for ($i = 0; $i < count($expectedKeypoints) - 1; $i += 2) {
    $p1 = $expectedKeypoints[$i];
    $p2 = $expectedKeypoints[$i + 1];
    $pairNum = ($i / 2) + 1;
    
    // Convert native keypoints to webcam resolution
    $webcam1 = [$p1[0] * $scaleToWebcam, $p1[1] * $scaleToWebcam];
    $webcam2 = [$p2[0] * $scaleToWebcam, $p2[1] * $scaleToWebcam];
    
    // Calculate distance at webcam resolution
    $webcamPixelDist = sqrt(pow($webcam2[0] - $webcam1[0], 2) + pow($webcam2[1] - $webcam1[1], 2));
    
    // Calculate cm using webcam pixels_per_cm
    $calcDistCm = $webcamPixelDist / $pixelsPerCm;
    
    echo "Pair $pairNum: webcam_dist = " . round($webcamPixelDist, 2) . " px => " . round($calcDistCm, 2) . " cm";
    echo " (expected: " . round($expectedDistances[$pairNum], 2) . " cm)\n";
}

echo "\n--- CONCLUSION ---\n";
$nativePxPerCm = $cal->pixels_per_cm * ($nativeW / $webcamW);
echo "Your calibration implies " . round($nativePxPerCm, 2) . " px/cm at native resolution.\n";
echo "The Python annotations imply ~34.18 px/cm at native resolution.\n";
echo "Ratio: " . round(34.18 / $nativePxPerCm, 2) . "x difference\n";
echo "\nThis means your calibration reference object may have been placed differently\n";
echo "than when the Python annotations were created, OR the reference length was different.\n";
