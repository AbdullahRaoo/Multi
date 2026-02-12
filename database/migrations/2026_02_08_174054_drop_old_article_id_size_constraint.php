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
        // Drop ALL possible old unique constraints that might be blocking uploads
        // Try all possible naming patterns
        $constraintsToTry = [
            'uploaded_annotations_article_id_size_unique',
            'article_id_size',
            'article_id_size_unique',
            'uploaded_annotations_article_style_size_unique',
        ];
        
        foreach ($constraintsToTry as $constraint) {
            try {
                DB::statement("ALTER TABLE uploaded_annotations DROP INDEX IF EXISTS {$constraint}");
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
        // Keep this empty for safety
    }
};
