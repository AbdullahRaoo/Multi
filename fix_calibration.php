<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$cal = \App\Models\CameraCalibration::getActive();

if (!$cal) {
    echo "No active calibration found.\n";
    exit(1);
}

echo "=== FIXING CALIBRATION ===\n\n";
echo "Current calibration points: " . json_encode($cal->calibration_points) . "\n";
echo "Current pixels_per_cm: " . $cal->pixels_per_cm . " (WRONG - used percentages as pixels)\n";
echo "Current pixel_distance: " . $cal->pixel_distance . " (WRONG)\n\n";

// Recalculate with proper pixel conversion
$webcamWidth = 1920;
$webcamHeight = 1080;
$point1 = $cal->calibration_points[0];
$point2 = $cal->calibration_points[1];

$pixel1X = ($point1[0] / 100) * $webcamWidth;
$pixel1Y = ($point1[1] / 100) * $webcamHeight;
$pixel2X = ($point2[0] / 100) * $webcamWidth;
$pixel2Y = ($point2[1] / 100) * $webcamHeight;

$pixelDistance = sqrt(pow($pixel2X - $pixel1X, 2) + pow($pixel2Y - $pixel1Y, 2));
$pixelsPerCm = $pixelDistance / $cal->reference_length_cm;

echo "Point 1 (percent): [" . $point1[0] . ", " . $point1[1] . "]\n";
echo "Point 1 (pixels):  [" . round($pixel1X, 2) . ", " . round($pixel1Y, 2) . "]\n";
echo "Point 2 (percent): [" . $point2[0] . ", " . $point2[1] . "]\n";
echo "Point 2 (pixels):  [" . round($pixel2X, 2) . ", " . round($pixel2Y, 2) . "]\n\n";

echo "Correct pixel distance: " . round($pixelDistance, 2) . " pixels\n";
echo "Correct pixels_per_cm: " . round($pixelsPerCm, 4) . " px/cm\n\n";

// Update the calibration
$cal->pixel_distance = (int) round($pixelDistance);
$cal->pixels_per_cm = $pixelsPerCm;
$cal->save();

echo "✅ Calibration updated!\n";
