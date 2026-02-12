<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('uploaded_annotations', function (Blueprint $table) {
            // Add article_id foreign key after id column
            $table->foreignId('article_id')
                ->nullable()
                ->after('id')
                ->constrained('articles')
                ->nullOnDelete();
            
            // Update the unique constraint to use article_id instead of article_style
            $table->dropUnique(['article_style', 'size']);
            $table->unique(['article_id', 'size']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('uploaded_annotations', function (Blueprint $table) {
            // Restore original unique constraint
            $table->dropUnique(['article_id', 'size']);
            $table->unique(['article_style', 'size']);
            
            // Remove foreign key and column
            $table->dropForeign(['article_id']);
            $table->dropColumn('article_id');
        });
    }
};
