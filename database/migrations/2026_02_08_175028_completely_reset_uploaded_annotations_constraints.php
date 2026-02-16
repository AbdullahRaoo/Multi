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
            } catch (\Exception $e) {
                // Ignore errors
            }
        }

        // Now add ONLY the correct unique constraint
        try {
            DB::statement('
                ALTER TABLE uploaded_annotations
                ADD UNIQUE uploaded_annotations_article_style_size_side_unique(article_style, size, side)
            ');
        } catch (\Exception $e) {
            // Already exists
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if index exists before dropping (MySQL 5.7 compatible)
        $result = DB::select("
            SELECT COUNT(*) as cnt
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = 'uploaded_annotations'
            AND index_name = 'uploaded_annotations_article_style_size_side_unique'
        ");

        if ($result[0]->cnt > 0) {
            DB::statement('ALTER TABLE uploaded_annotations DROP INDEX uploaded_annotations_article_style_size_side_unique');
        }
    }
};
