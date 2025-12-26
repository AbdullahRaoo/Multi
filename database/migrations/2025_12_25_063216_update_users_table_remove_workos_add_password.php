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
        Schema::table('users', function (Blueprint $table) {
            // Remove WorkOS column if it exists
            if (Schema::hasColumn('users', 'workos_id')) {
                $table->dropUnique(['workos_id']);
                $table->dropColumn('workos_id');
            }

            // Add password column if it doesn't exist
            if (!Schema::hasColumn('users', 'password')) {
                $table->string('password')->after('email_verified_at');
            }

            // Make avatar nullable if it's not already
            if (Schema::hasColumn('users', 'avatar')) {
                $table->text('avatar')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore WorkOS column
            if (!Schema::hasColumn('users', 'workos_id')) {
                $table->string('workos_id')->unique()->after('email_verified_at');
            }

            // Remove password column
            if (Schema::hasColumn('users', 'password')) {
                $table->dropColumn('password');
            }

            // Make avatar required again
            if (Schema::hasColumn('users', 'avatar')) {
                $table->text('avatar')->nullable(false)->change();
            }
        });
    }
};
