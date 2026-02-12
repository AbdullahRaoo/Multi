<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$output = "=== UPLOADED_ANNOTATIONS TABLE STRUCTURE ===\n\n";

// Get columns
$output .= "COLUMNS:\n";
$output .= str_repeat("-", 100) . "\n";
$columns = DB::select('DESCRIBE uploaded_annotations');
foreach ($columns as $col) {
    $null = $col->Null == 'YES' ? 'NULL' : 'NOT NULL';
    $default = $col->Default !== null ? "DEFAULT '{$col->Default}'" : '';
    $output .= sprintf("%-30s | %-20s | %-10s | %s\n", $col->Field, $col->Type, $null, $default);
}

// Get indexes
$output .= "\n" . str_repeat("-", 100) . "\n";
$output .= "INDEXES:\n";
$output .= str_repeat("-", 100) . "\n";
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
    $output .= sprintf("%-10s | %-50s | (%s)\n", $type, $name, $columns);
}

// Get CREATE TABLE
$output .= "\n" . str_repeat("=", 100) . "\n";
$output .= "FULL CREATE TABLE STATEMENT:\n";
$output .= str_repeat("=", 100) . "\n";
$result = DB::select('SHOW CREATE TABLE uploaded_annotations');
$output .= $result[0]->{'Create Table'} . "\n";

// Save to file
file_put_contents(__DIR__ . '/database_structure.txt', $output);
echo $output;
echo "\n\nStructure saved to: database_structure.txt\n";
