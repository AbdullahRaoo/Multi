<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add soft-delete column to measurement_sizes so parent-child integrity
     * is maintained when a measurement is soft-deleted.
     */
    public function up(): void
    {
        Schema::table('measurement_sizes', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('measurement_sizes', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
