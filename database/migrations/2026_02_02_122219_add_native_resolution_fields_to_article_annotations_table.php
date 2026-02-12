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
            $table->integer('native_width')->default(5488)->after('image_height');
            $table->integer('native_height')->default(3672)->after('native_width');
            $table->string('capture_source', 50)->default('webcam')->after('native_height');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('article_annotations', function (Blueprint $table) {
            $table->dropColumn(['native_width', 'native_height', 'capture_source']);
        });
    }
};
