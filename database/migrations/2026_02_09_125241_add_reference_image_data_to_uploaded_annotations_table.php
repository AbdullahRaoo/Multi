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
            // Store the actual image binary data in database (LONGBLOB can store up to 4GB)
            $table->longText('reference_image_data')->nullable()->after('reference_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('uploaded_annotations', function (Blueprint $table) {
            $table->dropColumn('reference_image_data');
        });
    }
};
