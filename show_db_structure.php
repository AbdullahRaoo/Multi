<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== UPLOADED_ANNOTATIONS TABLE STRUCTURE ===\n\n";

// Get the full CREATE TABLE statement
$result = DB::select('SHOW CREATE TABLE uploaded_annotations');
$createStatement = $result[0]->{'Create Table'};

// Format it nicely
echo $createStatement . "\n\n";

echo str_repeat("=", 80) . "\n";
echo "KEY POINTS:\n";
echo str_repeat("=", 80) . "\n\n";

// Show columns
echo "COLUMNS:\n";
$columns = DB::select('DESCRIBE uploaded_annotations');
foreach ($columns as $col) {
    $null = $col->Null == 'YES' ? 'NULL' : 'NOT NULL';
    $default = $col->Default ? "DEFAULT '{$col->Default}'" : '';
    echo sprintf("  %-30s %-20s %-10s %s\n", $col->Field, $col->Type, $null, $default);
}

// Show indexes
echo "\nINDEXES:\n";
$indexes = DB::select('SHOW INDEX FROM uploaded_annotations');
$indexGroups = [];
foreach ($indexes as $idx) {
    if (!isset($indexGroups[$idx->Key_name])) {
        $indexGroups[$idx->Key_name] = [
            'columns' => [],
            'unique' => $idx->Non_unique == 0
        ];
    }
    $indexGroups[$idx->Key_name]['columns'][] = $idx->Column_name;
}

foreach ($indexGroups as $name => $info) {
    $type = $info['unique'] ? 'UNIQUE' : 'INDEX';
    $columns = implode(', ', $info['columns']);
    echo "  {$type}: {$name} ({$columns})\n";
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "UNIQUE CONSTRAINT EXPLANATION:\n";
echo str_repeat("=", 80) . "\n";
echo "The unique key 'uploaded_annotations_article_size_side_unique' ensures:\n";
echo "  - One FRONT annotation per article + size\n";
echo "  - One BACK annotation per article + size\n";
echo "  - Same article + size can have BOTH front AND back\n";
echo "  - Duplicate only if: same article_id + same size + same side\n";
