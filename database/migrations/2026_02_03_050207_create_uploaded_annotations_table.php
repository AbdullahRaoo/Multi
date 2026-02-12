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
        Schema::create('uploaded_annotations', function (Blueprint $table) {
            $table->id();
            
            // Identifier fields
            $table->string('article_style')->index();
            $table->string('size')->index();
            $table->string('name')->nullable();
            
            // JSON content from uploaded file (stored as-is)
            $table->json('annotation_data');
            
            // Reference image storage
            $table->string('reference_image_path')->nullable();
            $table->string('reference_image_filename')->nullable();
            $table->string('reference_image_mime_type')->nullable();
            $table->unsignedBigInteger('reference_image_size')->nullable();
            
            // Image dimensions (extracted from uploaded image or JSON)
            $table->integer('image_width')->nullable();
            $table->integer('image_height')->nullable();
            
            // Original JSON filename for reference
            $table->string('original_json_filename')->nullable();
            
            // API access path for Electron app
            $table->string('api_image_url')->nullable();
            
            // Metadata
            $table->string('upload_source')->default('manual'); // manual, api, import
            $table->timestamp('annotation_date')->nullable(); // From JSON if available
            $table->timestamps();
            
            // Unique constraint on article_style + size
            $table->unique(['article_style', 'size']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uploaded_annotations');
    }
};
