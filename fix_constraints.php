<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== FIXING DATABASE CONSTRAINTS ===\n\n";

// Step 1: Show all current indexes
echo "Step 1: Current indexes on uploaded_annotations:\n";
$indexes = DB::select('SHOW INDEX FROM uploaded_annotations');
foreach ($indexes as $index) {
    echo "  - {$index->Key_name}: {$index->Column_name} (Unique: " . ($index->Non_unique == 0 ? 'YES' : 'NO') . ")\n";
}

// Step 2: Drop the problematic constraint directly
echo "\nStep 2: Dropping old constraints...\n";

$constraintsToDrop = [
    'uploaded_annotations_article_id_size_unique',
    'uploaded_annotations_article_id_size_side_unique',
    'uploaded_annotations_article_style_size_unique',
];

foreach ($constraintsToDrop as $constraint) {
    try {
        DB::statement("DROP INDEX {$constraint} ON uploaded_annotations");
        echo "  ✓ Dropped: {$constraint}\n";
    } catch (Exception $e) {
        echo "  - {$constraint} not found (OK)\n";
    }
}

// Step 3: Check if correct constraint exists
echo "\nStep 3: Checking for correct constraint...\n";
$hasCorrect = false;
$indexes = DB::select('SHOW INDEX FROM uploaded_annotations');
foreach ($indexes as $index) {
    if ($index->Key_name === 'uploaded_annotations_article_style_size_side_unique') {
        $hasCorrect = true;
    }
}

// Step 4: Add correct constraint if missing
if (!$hasCorrect) {
    echo "  Adding correct constraint (article_style, size, side)...\n";
    try {
        DB::statement('CREATE UNIQUE INDEX uploaded_annotations_article_style_size_side_unique ON uploaded_annotations (article_style, size, side)');
        echo "  ✓ Added correct constraint!\n";
    } catch (Exception $e) {
        echo "  Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "  ✓ Correct constraint already exists.\n";
}

// Step 5: Show final state
echo "\nStep 5: Final indexes on uploaded_annotations:\n";
$indexes = DB::select('SHOW INDEX FROM uploaded_annotations');
foreach ($indexes as $index) {
    echo "  - {$index->Key_name}: {$index->Column_name} (Unique: " . ($index->Non_unique == 0 ? 'YES' : 'NO') . ")\n";
}

echo "\n=== DONE ===\n";
