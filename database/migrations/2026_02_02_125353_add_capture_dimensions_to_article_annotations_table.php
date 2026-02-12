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
            // Actual dimensions of the captured/stored image (webcam resolution)
            $table->integer('capture_width')->nullable()->after('capture_source');
            $table->integer('capture_height')->nullable()->after('capture_width');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('article_annotations', function (Blueprint $table) {
            $table->dropColumn(['capture_width', 'capture_height']);
        });
    }
};
