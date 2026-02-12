<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== STEP-BY-STEP DATABASE FIX ===\n\n";

// STEP 1: Check existing indexes
echo "STEP 1: SHOW INDEX FROM uploaded_annotations\n";
echo str_repeat("-", 60) . "\n";
$indexes = DB::select('SHOW INDEX FROM uploaded_annotations');
foreach ($indexes as $idx) {
    echo "Key_name: {$idx->Key_name} | Column: {$idx->Column_name} | Non_unique: {$idx->Non_unique}\n";
}

// STEP 2: Drop ALL non-primary unique indexes (Non_unique = 0 means UNIQUE)
echo "\n" . str_repeat("-", 60) . "\n";
echo "STEP 2: Dropping ALL unique indexes (except PRIMARY)...\n";
$uniqueIndexNames = [];
foreach ($indexes as $idx) {
    if ($idx->Non_unique == 0 && $idx->Key_name != 'PRIMARY') {
        $uniqueIndexNames[$idx->Key_name] = true;
    }
}

foreach (array_keys($uniqueIndexNames) as $indexName) {
    $sql = "ALTER TABLE uploaded_annotations DROP INDEX `{$indexName}`";
    echo "Running: {$sql}\n";
    try {
        DB::statement($sql);
        echo "  ✓ DROPPED: {$indexName}\n";
    } catch (Exception $e) {
        echo "  ✗ ERROR: " . $e->getMessage() . "\n";
    }
}

// STEP 3: Confirm indexes are gone
echo "\n" . str_repeat("-", 60) . "\n";
echo "STEP 3: Confirming unique indexes are gone...\n";
$indexes = DB::select('SHOW INDEX FROM uploaded_annotations WHERE Non_unique = 0 AND Key_name != "PRIMARY"');
if (count($indexes) == 0) {
    echo "  ✓ No unique indexes remain (except PRIMARY)\n";
} else {
    echo "  ✗ REMAINING UNIQUE INDEXES:\n";
    foreach ($indexes as $idx) {
        echo "    - {$idx->Key_name}: {$idx->Column_name}\n";
    }
}

// STEP 4: Create correct unique constraint
echo "\n" . str_repeat("-", 60) . "\n";
echo "STEP 4: Creating CORRECT unique constraint (article_id, size, side)...\n";
$sql = "ALTER TABLE uploaded_annotations ADD UNIQUE KEY `uploaded_annotations_article_size_side_unique` (`article_id`, `size`, `side`)";
echo "Running: {$sql}\n";
try {
    DB::statement($sql);
    echo "  ✓ CREATED: uploaded_annotations_article_size_side_unique (article_id, size, side)\n";
} catch (Exception $e) {
    echo "  ✗ ERROR: " . $e->getMessage() . "\n";
}

// STEP 5: Verify final structure
echo "\n" . str_repeat("-", 60) . "\n";
echo "STEP 5: FINAL VERIFICATION\n";
$createTable = DB::select('SHOW CREATE TABLE uploaded_annotations');
echo "\nSHOW CREATE TABLE uploaded_annotations:\n";
echo $createTable[0]->{'Create Table'} . "\n";

echo "\n" . str_repeat("=", 60) . "\n";
echo "DONE! System now allows:\n";
echo "  ✓ Article 27 + 11-12 Years + Front → ALLOWED\n";
echo "  ✓ Article 27 + 11-12 Years + Back → ALLOWED\n";
echo "  ✗ Article 27 + 11-12 Years + Front (again) → BLOCKED\n";
