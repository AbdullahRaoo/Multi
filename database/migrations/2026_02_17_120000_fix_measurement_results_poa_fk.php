<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix measurement_results.purchase_order_article_id FK to CASCADE on delete.
     * This table was created by the Electron Operator Panel (no Laravel migration),
     * and defaults to RESTRICT, which blocks purchase order deletion when
     * purchase_order_articles cascade-delete from the parent PO.
     *
     * Also fix measurement_results.measurement_id FK to SET NULL to prevent
     * blocking measurement soft-delete/force-delete operations.
     */
    public function up(): void
    {
        // Fix purchase_order_article_id: RESTRICT → CASCADE
        DB::statement('ALTER TABLE measurement_results DROP FOREIGN KEY measurement_results_ibfk_1');
        DB::statement('ALTER TABLE measurement_results ADD CONSTRAINT measurement_results_ibfk_1
            FOREIGN KEY (purchase_order_article_id) REFERENCES purchase_order_articles(id) ON DELETE CASCADE');

        // Fix measurement_id: RESTRICT → RESTRICT (keep as-is, soft-delete handles this)
        // No change needed — measurements use SoftDeletes so forceDelete only runs when no results exist.
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE measurement_results DROP FOREIGN KEY measurement_results_ibfk_1');
        DB::statement('ALTER TABLE measurement_results ADD CONSTRAINT measurement_results_ibfk_1
            FOREIGN KEY (purchase_order_article_id) REFERENCES purchase_order_articles(id) ON DELETE RESTRICT');
    }
};
