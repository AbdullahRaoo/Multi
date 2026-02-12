<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== COMPLETE DATABASE FIX ===\n\n";

// Step 1: Drop ALL non-primary unique indexes
echo "Step 1: Dropping ALL unique indexes...\n";
$indexes = DB::select("SHOW INDEX FROM uploaded_annotations WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
$indexNames = [];
foreach ($indexes as $idx) {
    $indexNames[$idx->Key_name] = true;
}

foreach (array_keys($indexNames) as $indexName) {
    try {
        DB::statement("ALTER TABLE uploaded_annotations DROP INDEX `{$indexName}`");
        echo "   ✓ Dropped: {$indexName}\n";
    } catch (Exception $e) {
        echo "   ✗ Failed to drop {$indexName}: " . $e->getMessage() . "\n";
    }
}

// Step 2: Ensure side column exists with correct type
echo "\nStep 2: Checking side column...\n";
$columns = DB::select("SHOW COLUMNS FROM uploaded_annotations LIKE 'side'");
if (count($columns) == 0) {
    echo "   Adding side column...\n";
    DB::statement("ALTER TABLE uploaded_annotations ADD COLUMN side VARCHAR(10) NOT NULL DEFAULT 'front'");
    echo "   ✓ Side column added\n";
} else {
    echo "   ✓ Side column already exists\n";
}

// Step 3: Create the CORRECT unique key (article_id, size, side)
echo "\nStep 3: Creating correct unique key (article_id, size, side)...\n";
try {
    DB::statement("ALTER TABLE uploaded_annotations ADD UNIQUE KEY `article_id_size_side_unique` (`article_id`, `size`, `side`)");
    echo "   ✓ Created unique key: article_id_size_side_unique\n";
} catch (Exception $e) {
    echo "   ✗ Failed: " . $e->getMessage() . "\n";
}

// Step 4: Verify final state
echo "\nStep 4: Final verification...\n";
$finalIndexes = DB::select("SHOW INDEX FROM uploaded_annotations WHERE Non_unique = 0");
echo "   Final unique indexes:\n";
foreach ($finalIndexes as $idx) {
    echo "   - {$idx->Key_name}: {$idx->Column_name}\n";
}

// Step 5: Show current data
echo "\nStep 5: Current annotations in database:\n";
$annotations = DB::table('uploaded_annotations')->select('id', 'article_id', 'article_style', 'size', 'side')->get();
foreach ($annotations as $a) {
    echo "   ID:{$a->id} | article_id:{$a->article_id} | style:{$a->article_style} | size:{$a->size} | side:{$a->side}\n";
}

echo "\n=== DONE ===\n";
echo "\nNow the system allows:\n";
echo "  ✓ Article A + Size M + Front → Saved\n";
echo "  ✓ Article A + Size M + Back → Saved (DIFFERENT RECORD)\n";
echo "  ✗ Article A + Size M + Front (again) → BLOCKED (duplicate)\n";
