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
        Schema::create('article_annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->onDelete('cascade');
            $table->foreignId('article_image_id')->constrained('article_images')->onDelete('cascade');
            $table->string('article_style');
            $table->string('size');
            $table->string('name')->nullable(); // Annotation name/label
            $table->json('annotations'); // JSON containing point coordinates
            $table->string('reference_image_path')->nullable(); // Path to annotated image
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('article_annotations');
    }
};
