<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all unique indexes on the table
        $indexes = DB::select("
            SELECT DISTINCT INDEX_NAME 
            FROM information_schema.statistics 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'uploaded_annotations' 
            AND NON_UNIQUE = 0
            AND INDEX_NAME != 'PRIMARY'
        ");
        
        // Drop ALL unique indexes
        foreach ($indexes as $index) {
            try {
                DB::statement("ALTER TABLE uploaded_annotations DROP INDEX {$index->INDEX_NAME}");
                echo "Dropped index: {$index->INDEX_NAME}\n";
            } catch (\Exception $e) {
                echo "Could not drop {$index->INDEX_NAME}: " . $e->getMessage() . "\n";
            }
        }
        
        // Now add ONLY the correct unique constraint
        try {
            DB::statement('
                ALTER TABLE uploaded_annotations 
                ADD UNIQUE uploaded_annotations_article_style_size_side_unique(article_style, size, side)
            ');
            echo "Added correct unique constraint on (article_style, size, side)\n";
        } catch (\Exception $e) {
            echo "Error adding constraint: " . $e->getMessage() . "\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the correct constraint
        DB::statement('ALTER TABLE uploaded_annotations DROP INDEX IF EXISTS uploaded_annotations_article_style_size_side_unique');
    }
};
