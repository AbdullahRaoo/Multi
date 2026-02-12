<?php
/**
 * Calculate the exact percentage coordinates the user should click
 * to match the Python annotation keypoints
 */

echo "=== EXACT CLICK PERCENTAGES FOR PYTHON KEYPOINTS ===\n\n";

$nativeW = 5488;
$nativeH = 3672;

$expectedKeypoints = [
    [1806, 1318], [1710, 2024], [3395, 1359], [3465, 2045],
    [2280, 1144], [2895, 1173], [1809, 2924], [3308, 2945],
    [2268, 1062], [2225, 3073], [229, 1917], [323, 2135],
    [3410, 1285], [4849, 2061]
];

echo "To match the Python annotations EXACTLY, click at these percentage locations:\n\n";
echo "Point | Native Coords     | Click at (%)          | Description\n";
echo "------|-------------------|----------------------|-------------\n";

$pairDescriptions = [
    1 => "Pair 1: Left sleeve top",
    2 => "Pair 1: Left sleeve bottom",
    3 => "Pair 2: Right shoulder",
    4 => "Pair 2: Right side bottom",
    5 => "Pair 3: Collar left",
    6 => "Pair 3: Collar right",
    7 => "Pair 4: Left hem",
    8 => "Pair 4: Right hem",
    9 => "Pair 5: Center top",
    10 => "Pair 5: Center bottom",
    11 => "Pair 6: Tag/Label top",
    12 => "Pair 6: Tag/Label bottom",
    13 => "Pair 7: Right armpit",
    14 => "Pair 7: Right side",
];

foreach ($expectedKeypoints as $i => $native) {
    $num = $i + 1;
    $pctX = ($native[0] / $nativeW) * 100;
    $pctY = ($native[1] / $nativeH) * 100;
    $desc = $pairDescriptions[$num] ?? "";
    
    printf("P%-4d | [%4d, %4d]      | [%5.2f%%, %5.2f%%]     | %s\n",
        $num, $native[0], $native[1], $pctX, $pctY, $desc);
}

echo "\n\n=== VISUAL GUIDE ===\n\n";
echo "The image is divided as follows:\n";
echo "  0%   - 33% X = Left third of image\n";
echo " 33%   - 66% X = Center third\n";
echo " 66%  - 100% X = Right third\n";
echo "\n";
echo "  0%   - 33% Y = Top third\n";
echo " 33%   - 66% Y = Middle third\n";
echo " 66%  - 100% Y = Bottom third\n";

echo "\n\n=== KEYPOINT LOCATIONS ON IMAGE ===\n\n";

foreach ($expectedKeypoints as $i => $native) {
    $num = $i + 1;
    $pctX = ($native[0] / $nativeW) * 100;
    $pctY = ($native[1] / $nativeH) * 100;
    
    $xPos = $pctX < 33 ? "LEFT" : ($pctX < 66 ? "CENTER" : "RIGHT");
    $yPos = $pctY < 33 ? "TOP" : ($pctY < 66 ? "MIDDLE" : "BOTTOM");
    
    echo "Point $num: $xPos-$yPos (". round($pctX) ."%, ". round($pctY) ."%)\n";
}
