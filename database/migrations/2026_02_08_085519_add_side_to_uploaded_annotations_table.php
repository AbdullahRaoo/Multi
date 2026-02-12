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
        // Step 1: Try to drop the old unique constraint if it exists
        try {
            Schema::table('uploaded_annotations', function (Blueprint $table) {
                $table->dropUnique('uploaded_annotations_article_style_size_unique');
            });
        } catch (\Exception $e) {
            // Constraint might not exist or have a different name, continue anyway
        }
        
        // Step 2: Add side column as string
        if (!Schema::hasColumn('uploaded_annotations', 'side')) {
            Schema::table('uploaded_annotations', function (Blueprint $table) {
                $table->string('side', 10)->default('front')->after('size');
            });
        }
        
        // Step 3: Add new unique constraint including side
        try {
            Schema::table('uploaded_annotations', function (Blueprint $table) {
                $table->unique(['article_style', 'size', 'side']);
            });
        } catch (\Exception $e) {
            // Constraint might already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('uploaded_annotations', function (Blueprint $table) {
            // Drop the unique constraint with side
            try {
                $table->dropUnique('uploaded_annotations_article_style_size_side_unique');
            } catch (\Exception $e) {
                // Ignore if not exists
            }
            
            // Drop the side column
            if (Schema::hasColumn('uploaded_annotations', 'side')) {
                $table->dropColumn('side');
            }
            
            // Restore the old unique constraint
            try {
                $table->unique(['article_style', 'size']);
            } catch (\Exception $e) {
                // Ignore if already exists
            }
        });
    }
};
