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
            $table->string('json_file_path')->nullable()->after('reference_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('article_annotations', function (Blueprint $table) {
            $table->dropColumn('json_file_path');
        });
    }
};
