<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DATABASE STATE CHECK ===\n\n";

// 1. Show ALL indexes
echo "1. ALL INDEXES on uploaded_annotations:\n";
$indexes = DB::select('SHOW INDEX FROM uploaded_annotations');
$uniqueIndexes = [];
foreach ($indexes as $index) {
    if ($index->Non_unique == 0 && $index->Key_name != 'PRIMARY') {
        if (!isset($uniqueIndexes[$index->Key_name])) {
            $uniqueIndexes[$index->Key_name] = [];
        }
        $uniqueIndexes[$index->Key_name][] = $index->Column_name;
    }
}
foreach ($uniqueIndexes as $name => $columns) {
    echo "   UNIQUE: {$name} on (" . implode(', ', $columns) . ")\n";
}

// 2. Show current data for Sweat Shirt 11-12 Years
echo "\n2. CURRENT DATA for article_id=27 (Sweat Shirt):\n";
$annotations = DB::select("SELECT id, article_id, article_style, size, side, name FROM uploaded_annotations WHERE article_id = 27");
if (count($annotations) == 0) {
    echo "   No annotations found.\n";
} else {
    foreach ($annotations as $a) {
        echo "   ID:{$a->id} | Style:{$a->article_style} | Size:{$a->size} | Side:{$a->side} | Name:{$a->name}\n";
    }
}

// 3. Check table structure for side column
echo "\n3. COLUMN DEFINITION for 'side':\n";
$columns = DB::select("SHOW COLUMNS FROM uploaded_annotations LIKE 'side'");
foreach ($columns as $col) {
    echo "   Type: {$col->Type}, Null: {$col->Null}, Default: {$col->Default}\n";
}

echo "\n=== END CHECK ===\n";
