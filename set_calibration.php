<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Set calibration to match Python system
// Native: 34.17 px/cm -> Webcam: 34.17 * (1920/5488) = 11.95 px/cm
$cal = \App\Models\CameraCalibration::getActive();

echo "Before: pixels_per_cm = " . $cal->pixels_per_cm . "\n";

$cal->pixels_per_cm = 11.95;  // at webcam resolution, equivalent to 34.17 at native
$cal->pixel_distance = 359;   // 30cm * 11.95 px/cm
$cal->save();

echo "After: pixels_per_cm = " . $cal->pixels_per_cm . "\n";
echo "\n✅ Calibration updated to match Python system:\n";
echo "   11.95 px/cm (webcam 1920x1080)\n";
echo "   34.17 px/cm (native 5488x3672)\n";
