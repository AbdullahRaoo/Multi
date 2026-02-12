<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds columns required for the Python measurement system:
     * - target_distances: Expected distances between point pairs (in cm)
     * - placement_box: Garment placement guide area coordinates
     * - keypoints_pixels: Keypoints in pixel coordinates (for measurement system)
     */
    public function up(): void
    {
        Schema::table('article_annotations', function (Blueprint $table) {
            // Target distances for QC validation (JSON: {"1": 3.81, "2": 19.56, ...})
            // Key is pair number (1 = points 1-2, 2 = points 3-4, etc.)
            // Value is expected distance in centimeters
            $table->json('target_distances')->nullable()->after('annotations');
            
            // Placement guide box for garment positioning (JSON: [x1, y1, x2, y2])
            // Coordinates are in pixels relative to reference image
            $table->json('placement_box')->nullable()->after('target_distances');
            
            // Keypoints in pixel coordinates for measurement system
            // (JSON: [[x1, y1], [x2, y2], ...])
            // These are absolute pixel positions on the reference image
            $table->json('keypoints_pixels')->nullable()->after('placement_box');
            
            // Image dimensions for coordinate conversion
            $table->integer('image_width')->nullable()->after('keypoints_pixels');
            $table->integer('image_height')->nullable()->after('image_width');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('article_annotations', function (Blueprint $table) {
            $table->dropColumn([
                'target_distances',
                'placement_box', 
                'keypoints_pixels',
                'image_width',
                'image_height'
            ]);
        });
    }
};
