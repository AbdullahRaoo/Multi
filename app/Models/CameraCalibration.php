<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CameraCalibration extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'pixels_per_cm',
        'reference_length_cm',
        'pixel_distance',
        'calibration_image',
        'calibration_points',
        'is_active',
    ];

    protected $casts = [
        'calibration_points' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the active calibration.
     */
    public static function getActive()
    {
        return self::where('is_active', true)->latest()->first();
    }

    /**
     * Set this calibration as active and deactivate others.
     */
    public function setActive(): void
    {
        // Deactivate all other calibrations
        self::where('id', '!=', $this->id)->update(['is_active' => false]);
        
        // Activate this one
        $this->update(['is_active' => true]);
    }

    /**
     * Get calibration data in format compatible with Python system.
     */
    public function getCalibrationFormat(): array
    {
        return [
            'pixels_per_cm' => $this->pixels_per_cm,
            'reference_length_cm' => $this->reference_length_cm,
            'is_calibrated' => true,
            'calibration_date' => $this->updated_at->toIso8601String(),
        ];
    }

    /**
     * Calculate pixels per cm from two points and known distance.
     */
    public static function calculatePixelsPerCm(array $point1, array $point2, float $realDistanceCm): float
    {
        $pixelDistance = sqrt(
            pow($point2[0] - $point1[0], 2) + 
            pow($point2[1] - $point1[1], 2)
        );
        
        return $pixelDistance / $realDistanceCm;
    }
}
