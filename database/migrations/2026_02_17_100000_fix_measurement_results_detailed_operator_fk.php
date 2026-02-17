<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix operator_id FK on measurement_results_detailed to SET NULL on delete,
     * so deleting an operator does not violate FK constraints.
     * The operator_id column is already nullable.
     */
    public function up(): void
    {
        Schema::table('measurement_results_detailed', function (Blueprint $table) {
            $table->dropForeign(['operator_id']);
            $table->foreign('operator_id')
                ->references('id')->on('operators')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('measurement_results_detailed', function (Blueprint $table) {
            $table->dropForeign(['operator_id']);
            $table->foreign('operator_id')
                ->references('id')->on('operators');
        });
    }
};
