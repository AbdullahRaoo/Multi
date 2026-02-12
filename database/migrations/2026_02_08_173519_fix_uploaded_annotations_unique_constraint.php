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
        // Drop the wrong unique constraint on (article_id, size, side) if it exists
        DB::statement('ALTER TABLE uploaded_annotations DROP INDEX IF EXISTS uploaded_annotations_article_id_size_side_unique');
        
        // Also try alternative naming patterns
        DB::statement('ALTER TABLE uploaded_annotations DROP INDEX IF EXISTS article_id_size_side');
        
        // Ensure the correct unique constraint on (article_style, size, side) exists
        // First check if it already exists
        $constraintExists = DB::select("
            SELECT COUNT(*) as count 
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
            AND table_name = 'uploaded_annotations' 
            AND index_name = 'uploaded_annotations_article_style_size_side_unique'
        ");
        
        if ($constraintExists[0]->count == 0) {
            DB::statement('ALTER TABLE uploaded_annotations ADD UNIQUE uploaded_annotations_article_style_size_side_unique(article_style, size, side)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the correct constraint
        DB::statement('ALTER TABLE uploaded_annotations DROP INDEX IF EXISTS uploaded_annotations_article_style_size_side_unique');
        
        // Restore the wrong one (for rollback purposes only)
        $constraintExists = DB::select("
            SELECT COUNT(*) as count 
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
            AND table_name = 'uploaded_annotations' 
            AND index_name = 'uploaded_annotations_article_id_size_side_unique'
        ");
        
        if ($constraintExists[0]->count == 0) {
            DB::statement('ALTER TABLE uploaded_annotations ADD UNIQUE uploaded_annotations_article_id_size_side_unique(article_id, size, side)');
        }
    }
};
