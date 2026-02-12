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
        Schema::table('article_annotations', function (Blueprint $table) {
            // Store reference image as LONGBLOB (up to 4GB, suitable for images)
            $table->longText('image_data')->nullable()->after('reference_image_path');
            // Store MIME type for proper image rendering
            $table->string('image_mime_type', 50)->nullable()->after('image_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('article_annotations', function (Blueprint $table) {
            $table->dropColumn(['image_data', 'image_mime_type']);
        });
    }
};
