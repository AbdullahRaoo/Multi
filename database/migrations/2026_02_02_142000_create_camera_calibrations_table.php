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
        Schema::create('camera_calibrations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->float('pixels_per_cm', 10, 4); // Scale factor: pixels per centimeter
            $table->float('reference_length_cm', 10, 2); // Known reference length in cm
            $table->integer('pixel_distance')->nullable(); // Measured pixel distance
            $table->text('calibration_image')->nullable(); // Base64 calibration image (optional)
            $table->json('calibration_points')->nullable(); // Two points used for calibration
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('camera_calibrations');
    }
};
