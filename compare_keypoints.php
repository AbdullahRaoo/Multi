<?php
/**
 * Compare keypoint locations between dashboard and expected Python annotations
 */

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== KEYPOINT LOCATION COMPARISON ===\n\n";

// Expected from Python system (at native 5488x3672)
$expectedKeypoints = [
    [1806, 1318],  // Point 1
    [1710, 2024],  // Point 2
    [3395, 1359],  // Point 3
    [3465, 2045],  // Point 4
    [2280, 1144],  // Point 5
    [2895, 1173],  // Point 6
    [1809, 2924],  // Point 7
    [3308, 2945],  // Point 8
    [2268, 1062],  // Point 9
    [2225, 3073],  // Point 10
    [229, 1917],   // Point 11
    [323, 2135],   // Point 12
    [3410, 1285],  // Point 13
    [4849, 2061],  // Point 14
];

$expectedDistances = [
    1 => 20.85,  // Pair 1 (points 1-2)
    2 => 20.18,  // Pair 2 (points 3-4)
    3 => 18.02,  // Pair 3 (points 5-6)
    4 => 43.88,  // Pair 4 (points 7-8)
    5 => 58.90,  // Pair 5 (points 9-10)
    6 => 6.97,   // Pair 6 (points 11-12)
    7 => 47.87,  // Pair 7 (points 13-14)
];

// Get dashboard annotation
$annotation = \App\Models\ArticleAnnotation::latest()->first();
$dashboardKeypoints = $annotation->keypoints_pixels;
$dashboardDistances = $annotation->target_distances;

echo "Point | Expected (Python)    | Dashboard            | Diff (pixels)      | Match?\n";
echo "------|---------------------|---------------------|-------------------|-------\n";

$totalDiff = 0;
$maxDiff = 0;
$mismatches = [];

for ($i = 0; $i < count($expectedKeypoints); $i++) {
    $expected = $expectedKeypoints[$i];
    $dashboard = isset($dashboardKeypoints[$i]) ? $dashboardKeypoints[$i] : [0, 0];
    
    $diffX = $dashboard[0] - $expected[0];
    $diffY = $dashboard[1] - $expected[1];
    $distance = sqrt($diffX * $diffX + $diffY * $diffY);
    
    $totalDiff += $distance;
    $maxDiff = max($maxDiff, $distance);
    
    $match = $distance < 50 ? "✅" : "❌";
    if ($distance >= 50) {
        $mismatches[] = $i + 1;
    }
    
    $pointNum = $i + 1;
    printf("P%-4d | [%4d, %4d]        | [%4d, %4d]        | %6.1f px          | %s\n",
        $pointNum, 
        $expected[0], $expected[1],
        $dashboard[0], $dashboard[1],
        $distance,
        $match
    );
}

echo "\n";
echo "=== SUMMARY ===\n";
echo "Total points: " . count($expectedKeypoints) . "\n";
echo "Dashboard points: " . count($dashboardKeypoints) . "\n";
echo "Average displacement: " . round($totalDiff / count($expectedKeypoints), 1) . " pixels\n";
echo "Maximum displacement: " . round($maxDiff, 1) . " pixels\n";

if (!empty($mismatches)) {
    echo "\n⚠️  MISMATCHED POINTS (>50px off): " . implode(", ", $mismatches) . "\n";
}

echo "\n=== PAIR-BY-PAIR COMPARISON ===\n\n";
echo "Pair | Points | Expected Distance | Dashboard Distance | Diff    | Match?\n";
echo "-----|--------|-------------------|-------------------|---------|-------\n";

for ($pair = 1; $pair <= 7; $pair++) {
    $expectedDist = $expectedDistances[$pair];
    $dashboardDist = isset($dashboardDistances[$pair]) ? $dashboardDistances[$pair] : 0;
    $diff = abs($dashboardDist - $expectedDist);
    $match = $diff < 1 ? "✅" : ($diff < 5 ? "⚠️" : "❌");
    
    $p1 = ($pair - 1) * 2 + 1;
    $p2 = $p1 + 1;
    
    printf("%-4d | %d-%-3d  | %8.2f cm       | %8.2f cm       | %5.2f cm | %s\n",
        $pair, $p1, $p2, $expectedDist, $dashboardDist, $diff, $match
    );
}

echo "\n=== POINT ORDER ANALYSIS ===\n";
echo "Checking if points might be in different order...\n\n";

// Check if dashboard points match expected but in different positions
for ($i = 0; $i < count($dashboardKeypoints); $i++) {
    $dashboard = $dashboardKeypoints[$i];
    
    // Find closest expected point
    $minDist = PHP_FLOAT_MAX;
    $closestIdx = -1;
    
    for ($j = 0; $j < count($expectedKeypoints); $j++) {
        $expected = $expectedKeypoints[$j];
        $dist = sqrt(pow($dashboard[0] - $expected[0], 2) + pow($dashboard[1] - $expected[1], 2));
        if ($dist < $minDist) {
            $minDist = $dist;
            $closestIdx = $j;
        }
    }
    
    $dashIdx = $i + 1;
    $expIdx = $closestIdx + 1;
    $orderMatch = ($dashIdx == $expIdx) ? "" : " ← REORDERED!";
    $distStatus = $minDist < 100 ? "✅" : "❌";
    
    printf("Dashboard P%d [%4d,%4d] → Closest to Expected P%d [%4d,%4d] (%.0f px) %s%s\n",
        $dashIdx, $dashboard[0], $dashboard[1],
        $expIdx, $expectedKeypoints[$closestIdx][0], $expectedKeypoints[$closestIdx][1],
        $minDist, $distStatus, $orderMatch
    );
}
