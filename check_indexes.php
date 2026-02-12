<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$indexes = DB::select('SHOW INDEX FROM uploaded_annotations');

echo "All indexes on uploaded_annotations table:\n";
echo str_repeat("=", 80) . "\n";

foreach ($indexes as $index) {
    if ($index->Key_name !== 'PRIMARY') {
        echo "Index Name: {$index->Key_name}\n";
        echo "Column: {$index->Column_name}\n";
        echo "Non_unique: {$index->Non_unique}\n";
        echo str_repeat("-", 80) . "\n";
    }
}
