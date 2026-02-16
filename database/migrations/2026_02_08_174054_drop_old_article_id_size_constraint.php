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
        // Drop ALL possible old unique constraints that might be blocking uploads
        $constraintsToTry = [
            'uploaded_annotations_article_id_size_unique',
            'article_id_size',
            'article_id_size_unique',
            'uploaded_annotations_article_style_size_unique',
        ];

        foreach ($constraintsToTry as $constraint) {
            try {
                if ($this->indexExists('uploaded_annotations', $constraint)) {
                    DB::statement("ALTER TABLE uploaded_annotations DROP INDEX {$constraint}");
                }
            } catch (\Exception $e) {
                // Ignore if doesn't exist
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't want to restore old constraints
    }
};
