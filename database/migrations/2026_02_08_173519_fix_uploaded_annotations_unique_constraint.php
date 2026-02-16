<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $result = DB::select("
            SELECT COUNT(*) as cnt
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = ?
            AND index_name = ?
        ", [$table, $indexName]);

        return $result[0]->cnt > 0;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the wrong unique constraint on (article_id, size, side) if it exists
        if ($this->indexExists('uploaded_annotations', 'uploaded_annotations_article_id_size_side_unique')) {
            DB::statement('ALTER TABLE uploaded_annotations DROP INDEX uploaded_annotations_article_id_size_side_unique');
        }

        // Also try alternative naming patterns
        if ($this->indexExists('uploaded_annotations', 'article_id_size_side')) {
            DB::statement('ALTER TABLE uploaded_annotations DROP INDEX article_id_size_side');
        }

        // Ensure the correct unique constraint on (article_style, size, side) exists
        if (!$this->indexExists('uploaded_annotations', 'uploaded_annotations_article_style_size_side_unique')) {
            DB::statement('ALTER TABLE uploaded_annotations ADD UNIQUE uploaded_annotations_article_style_size_side_unique(article_style, size, side)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the correct constraint
        if ($this->indexExists('uploaded_annotations', 'uploaded_annotations_article_style_size_side_unique')) {
            DB::statement('ALTER TABLE uploaded_annotations DROP INDEX uploaded_annotations_article_style_size_side_unique');
        }

        // Restore the wrong one (for rollback purposes only)
        if (!$this->indexExists('uploaded_annotations', 'uploaded_annotations_article_id_size_side_unique')) {
            DB::statement('ALTER TABLE uploaded_annotations ADD UNIQUE uploaded_annotations_article_id_size_side_unique(article_id, size, side)');
        }
    }
};
