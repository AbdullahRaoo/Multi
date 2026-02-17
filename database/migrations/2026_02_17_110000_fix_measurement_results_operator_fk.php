<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix measurement_results.operator_id FK to SET NULL on delete.
     * This table was created by the Electron Operator Panel (no Laravel migration),
     * and defaults to RESTRICT, which blocks operator deletion.
     * The column is already nullable, so SET NULL is safe.
     */
    public function up(): void
    {
        // measurement_results was created outside Laravel — use raw SQL
        // First find and drop the existing FK constraint
        DB::statement('ALTER TABLE measurement_results DROP FOREIGN KEY measurement_results_ibfk_3');
        DB::statement('ALTER TABLE measurement_results ADD CONSTRAINT measurement_results_ibfk_3
            FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE SET NULL ON UPDATE RESTRICT');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE measurement_results DROP FOREIGN KEY measurement_results_ibfk_3');
        DB::statement('ALTER TABLE measurement_results ADD CONSTRAINT measurement_results_ibfk_3
            FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE RESTRICT ON UPDATE RESTRICT');
    }
};
