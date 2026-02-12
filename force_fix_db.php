<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== FORCE FIX DATABASE CONSTRAINTS ===\n\n";

// Step 1: Get ALL indexes on the table
echo "Step 1: Finding all unique indexes...\n";
$indexes = DB::select("
    SELECT DISTINCT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'uploaded_annotations' 
    AND NON_UNIQUE = 0 
    AND INDEX_NAME != 'PRIMARY'
    GROUP BY INDEX_NAME
");

echo "Found " . count($indexes) . " unique index(es):\n";
foreach ($indexes as $index) {
    echo "  - {$index->INDEX_NAME}: ({$index->COLUMNS})\n";
}

// Step 2: Drop ALL unique indexes
echo "\nStep 2: Dropping ALL unique indexes...\n";
foreach ($indexes as $index) {
    $sql = "ALTER TABLE uploaded_annotations DROP INDEX `{$index->INDEX_NAME}`";
    echo "  SQL: {$sql}\n";
    try {
        DB::statement($sql);
        echo "  ✓ SUCCESS\n";
    } catch (Exception $e) {
        echo "  ✗ FAILED: " . $e->getMessage() . "\n";
    }
}

// Step 3: Add ONLY the correct constraint
echo "\nStep 3: Adding correct constraint (article_style, size, side)...\n";
$sql = "ALTER TABLE uploaded_annotations ADD UNIQUE INDEX `uploaded_annotations_article_style_size_side_unique` (`article_style`, `size`, `side`)";
echo "  SQL: {$sql}\n";
try {
    DB::statement($sql);
    echo "  ✓ SUCCESS\n";
} catch (Exception $e) {
    echo "  ✗ FAILED: " . $e->getMessage() . "\n";
}

// Step 4: Verify final state
echo "\nStep 4: Verifying final state...\n";
$finalIndexes = DB::select("
    SELECT DISTINCT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'uploaded_annotations' 
    AND NON_UNIQUE = 0 
    AND INDEX_NAME != 'PRIMARY'
    GROUP BY INDEX_NAME
");

echo "Final unique indexes:\n";
foreach ($finalIndexes as $index) {
    echo "  - {$index->INDEX_NAME}: ({$index->COLUMNS})\n";
}

echo "\n=== DONE ===\n";
echo "\nNow you can upload front and back annotations for the same article/size!\n";
