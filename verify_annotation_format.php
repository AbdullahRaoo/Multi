#!/usr/bin/env php
<?php
/**
 * Annotation Format Verification Script
 * 
 * This script verifies that annotation data in the database
 * matches the format expected by the Python measurement system (measurment2.py)
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\ArticleAnnotation;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n" . str_repeat("=", 70) . "\n";
echo "ANNOTATION FORMAT VERIFICATION\n";
echo str_repeat("=", 70) . "\n\n";

// Get all annotations
$annotations = ArticleAnnotation::all();

if ($annotations->isEmpty()) {
    echo "❌ No annotations found in database!\n";
    echo "   Please create annotations first using the Laravel UI.\n\n";
    exit(1);
}

echo "Found " . $annotations->count() . " annotation(s)\n\n";

$allValid = true;

foreach ($annotations as $annotation) {
    echo str_repeat("-", 70) . "\n";
    echo "Testing: {$annotation->article_style} - {$annotation->size}\n";
    echo str_repeat("-", 70) . "\n";
    
    $errors = [];
    
    // 1. Check keypoints_pixels format
    echo "\n[1] Checking keypoints_pixels format...\n";
    if (!$annotation->keypoints_pixels) {
        $errors[] = "keypoints_pixels is null or empty";
    } else {
        $keypoints = $annotation->keypoints_pixels;
        
        if (!is_array($keypoints)) {
            $errors[] = "keypoints_pixels is not an array";
        } else {
            echo "    ✓ Is array\n";
            echo "    ✓ Count: " . count($keypoints) . " keypoints\n";
            
            // Check each keypoint is [x, y] format
            $validFormat = true;
            foreach ($keypoints as $i => $point) {
                if (!is_array($point) || count($point) !== 2) {
                    $errors[] = "Keypoint $i is not [x, y] format";
                    $validFormat = false;
                    break;
                }
                if (!is_numeric($point[0]) || !is_numeric($point[1])) {
                    $errors[] = "Keypoint $i coordinates are not numeric";
                    $validFormat = false;
                    break;
                }
            }
            
            if ($validFormat) {
                echo "    ✓ All keypoints are [x, y] format\n";
                echo "    ✓ Sample: [{$keypoints[0][0]}, {$keypoints[0][1]}]\n";
            }
        }
    }
    
    // 2. Check target_distances format
    echo "\n[2] Checking target_distances format...\n";
    $targetDistances = $annotation->target_distances ?? [];
    
    if (empty($targetDistances)) {
        echo "    ⚠ Empty (will be set after first measurement)\n";
    } else {
        echo "    ✓ Count: " . count($targetDistances) . " measurements\n";
        
        // Check keys are numeric strings (will be converted to integers)
        $validKeys = true;
        foreach (array_keys($targetDistances) as $key) {
            if (!is_numeric($key)) {
                $errors[] = "Target distance key '$key' is not numeric";
                $validKeys = false;
                break;
            }
        }
        
        if ($validKeys) {
            echo "    ✓ All keys are numeric\n";
            $firstKey = array_key_first($targetDistances);
            echo "    ✓ Sample: {$firstKey} => {$targetDistances[$firstKey]}\n";
        }
    }
    
    // 3. Check placement_box format
    echo "\n[3] Checking placement_box format...\n";
    $placementBox = $annotation->placement_box ?? [];
    
    if (empty($placementBox)) {
        echo "    ⚠ Not set (optional)\n";
    } else {
        if (!is_array($placementBox) || count($placementBox) !== 4) {
            $errors[] = "placement_box must be [x1, y1, x2, y2] format";
        } else {
            echo "    ✓ Format: [{$placementBox[0]}, {$placementBox[1]}, {$placementBox[2]}, {$placementBox[3]}]\n";
        }
    }
    
    // 4. Check image dimensions
    echo "\n[4] Checking image dimensions...\n";
    if (!$annotation->image_width || !$annotation->image_height) {
        $errors[] = "Image dimensions not set";
    } else {
        echo "    ✓ Dimensions: {$annotation->image_width}x{$annotation->image_height}\n";
    }
    
    // 5. Check image data
    echo "\n[5] Checking image data...\n";
    if (!$annotation->image_data) {
        $errors[] = "No image data (Base64) stored";
    } else {
        $imageSize = strlen($annotation->image_data) * 0.75 / 1024; // Approximate KB
        echo "    ✓ Image stored (Base64)\n";
        echo "    ✓ Size: " . number_format($imageSize, 2) . " KB\n";
        echo "    ✓ MIME: {$annotation->image_mime_type}\n";
    }
    
    // 6. Test getMeasurementSystemFormat() method
    echo "\n[6] Testing getMeasurementSystemFormat() method...\n";
    try {
        $pythonFormat = $annotation->getMeasurementSystemFormat();
        
        // Verify structure
        if (!isset($pythonFormat['keypoints'])) {
            $errors[] = "getMeasurementSystemFormat() missing 'keypoints'";
        }
        if (!isset($pythonFormat['target_distances'])) {
            $errors[] = "getMeasurementSystemFormat() missing 'target_distances'";
        }
        if (!isset($pythonFormat['placement_box'])) {
            $errors[] = "getMeasurementSystemFormat() missing 'placement_box'";
        }
        if (!isset($pythonFormat['annotation_date'])) {
            $errors[] = "getMeasurementSystemFormat() missing 'annotation_date'";
        }
        
        if (empty($errors)) {
            echo "    ✓ Structure valid\n";
            echo "    ✓ Keys: " . implode(', ', array_keys($pythonFormat)) . "\n";
            
            // Check integer keys for target_distances
            if (!empty($pythonFormat['target_distances'])) {
                $firstKey = array_key_first($pythonFormat['target_distances']);
                if (is_int($firstKey)) {
                    echo "    ✓ Target distance keys are integers\n";
                } else {
                    $errors[] = "Target distance keys should be integers, found: " . gettype($firstKey);
                }
            }
        }
    } catch (Exception $e) {
        $errors[] = "getMeasurementSystemFormat() threw exception: " . $e->getMessage();
    }
    
    // Summary for this annotation
    echo "\n";
    if (empty($errors)) {
        echo "✅ PASSED - Format is compatible with Python measurement system\n";
    } else {
        echo "❌ FAILED - Found " . count($errors) . " issue(s):\n";
        foreach ($errors as $error) {
            echo "   • $error\n";
        }
        $allValid = false;
    }
    
    echo "\n";
}

// Final summary
echo str_repeat("=", 70) . "\n";
if ($allValid) {
    echo "✅ ALL ANNOTATIONS VALID\n";
    echo "\nYour annotations are ready for the Electron app and Python measurement system!\n";
    echo "\nNext steps:\n";
    echo "1. Use the Electron app to fetch annotations from MySQL\n";
    echo "2. Write annotation_data.json and reference_image.jpg files\n";
    echo "3. Run Python measurement system (measurment2.py)\n";
} else {
    echo "❌ SOME ANNOTATIONS HAVE ISSUES\n";
    echo "\nPlease fix the errors above before using with the measurement system.\n";
}
echo str_repeat("=", 70) . "\n\n";

// Optional: Show sample output for first annotation
if ($annotations->isNotEmpty()) {
    $firstAnnotation = $annotations->first();
    echo "Sample annotation_data.json output:\n";
    echo str_repeat("-", 70) . "\n";
    echo json_encode($firstAnnotation->getMeasurementSystemFormat(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    echo str_repeat("-", 70) . "\n\n";
}

exit($allValid ? 0 : 1);
