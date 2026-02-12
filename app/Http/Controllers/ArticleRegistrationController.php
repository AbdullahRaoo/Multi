<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\ArticleAnnotation;
use App\Models\ArticleImage;
use App\Models\ArticleRegistrationSetting;
use App\Models\CameraCalibration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ArticleRegistrationController extends Controller
{
    /**
     * Display the article registration page.
     */
    public function index(Request $request): Response
    {
        $hasPassword = ArticleRegistrationSetting::getValue('password') !== null;

        // Get all unique article styles from the database
        $articleStyles = Article::select('id', 'article_style', 'brand_id')
            ->with('brand:id,name')
            ->orderBy('article_style')
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'article_style' => $article->article_style,
                    'brand_name' => $article->brand->name ?? 'Unknown Brand',
                ];
            });

        return Inertia::render('article-registration/index', [
            'hasPassword' => $hasPassword,
            'articleStyles' => $articleStyles,
        ]);
    }

    /**
     * Get sizes available for a specific article style.
     */
    public function getSizes(Request $request, int $articleId): JsonResponse
    {
        $article = Article::findOrFail($articleId);
        
        // Get unique sizes from article images for this article
        $sizes = ArticleImage::where('article_id', $articleId)
            ->distinct()
            ->pluck('size')
            ->filter()
            ->values();

        return response()->json([
            'success' => true,
            'sizes' => $sizes,
            'article_style' => $article->article_style,
        ]);
    }

    /**
     * Get images for a specific article and size (for annotation).
     */
    public function getImages(Request $request, int $articleId, string $size): JsonResponse
    {
        $article = Article::findOrFail($articleId);
        
        $images = ArticleImage::where('article_id', $articleId)
            ->where('size', $size)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($image) {
                return [
                    'id' => $image->id,
                    'image_path' => $image->image_path,
                    'image_name' => $image->image_name,
                    'size' => $image->size,
                    'created_at' => $image->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Check if there's an existing annotation for this article style and size
        $annotation = ArticleAnnotation::where('article_style', $article->article_style)
            ->where('size', $size)
            ->first();

        $annotationData = null;
        if ($annotation) {
            $annotationData = [
                'id' => $annotation->id,
                'name' => $annotation->name,
                'annotations' => $annotation->annotations,
                'target_distances' => $annotation->target_distances ?? [],
                'article_style' => $annotation->article_style,
                'size' => $annotation->size,
                'reference_image_path' => $annotation->reference_image_path,
                'json_file_path' => $annotation->json_file_path,
                'created_at' => $annotation->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $annotation->updated_at->format('Y-m-d H:i:s'),
            ];
        }

        return response()->json([
            'success' => true,
            'images' => $images,
            'article_style' => $article->article_style,
            'size' => $size,
            'annotation' => $annotationData,
        ]);
    }

    /**
     * Set the one-time password (first time setup only).
     */
    public function setPassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]).+$/',
            ],
            'current_password' => ['nullable', 'string'],
        ], [
            'password.min' => 'Password must be at least 8 characters.',
            'password.regex' => 'Password must contain at least one letter and one special character.',
        ]);

        $existingPassword = ArticleRegistrationSetting::getValue('password');

        // If password exists, verify current password first (for changing password)
        if ($existingPassword) {
            if (!$request->current_password || !Hash::check($request->current_password, $existingPassword)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect.',
                ], 401);
            }
        }

        ArticleRegistrationSetting::setValue('password', Hash::make($request->password));

        return response()->json([
            'success' => true,
            'message' => 'Password set successfully.',
        ]);
    }

    /**
     * Verify the password for page access.
     */
    public function verifyPassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $storedPassword = ArticleRegistrationSetting::getValue('password');

        if (!$storedPassword || !Hash::check($request->password, $storedPassword)) {
            return response()->json([
                'success' => false,
                'message' => 'Incorrect password.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password verified.',
        ]);
    }

    /**
     * Save annotation for an image.
     */
    public function saveAnnotation(Request $request): JsonResponse
    {
        $request->validate([
            'article_id' => ['required', 'exists:articles,id'],
            'article_image_id' => ['required', 'exists:article_images,id'],
            'annotations' => ['required', 'array'],
            'annotations.*.x' => ['required', 'numeric'],
            'annotations.*.y' => ['required', 'numeric'],
            'annotations.*.label' => ['nullable', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        // Check for active calibration - required to calculate target distances
        $activeCalibration = CameraCalibration::getActive();
        if (!$activeCalibration || $activeCalibration->pixels_per_cm <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'No active camera calibration found. Please calibrate the camera first to auto-calculate target distances.',
            ], 422);
        }

        $article = Article::findOrFail($request->article_id);
        $articleImage = ArticleImage::findOrFail($request->article_image_id);

        // Ensure annotations directory exists (flat structure - no subfolders)
        $annotationsDirectory = storage_path('app/public/annotations');
        if (!is_dir($annotationsDirectory)) {
            mkdir($annotationsDirectory, 0755, true);
        }

        // File naming: {article_style}_{size}.jpg (flat structure, no JSON files)
        // Sanitize style and size to prevent directory issues (replace / and \ with _)
        $safeStyle = str_replace(['/', '\\'], '_', $article->article_style);
        $safeSize = str_replace(['/', '\\'], '_', $articleImage->size);
        
        $referenceImageFilename = $safeStyle . '_' . $safeSize . '.jpg';
        $referenceImagePath = 'annotations/' . $referenceImageFilename;
        $referenceImageFullPath = $annotationsDirectory . '/' . $referenceImageFilename;

        // Check if there's an existing annotation with a different image path - delete old image
        $existingAnnotation = ArticleAnnotation::where('article_style', $article->article_style)
            ->where('size', $articleImage->size)
            ->first();
        
        if ($existingAnnotation && $existingAnnotation->reference_image_path !== $referenceImagePath) {
            $oldImagePath = storage_path('app/public/' . $existingAnnotation->reference_image_path);
            if (file_exists($oldImagePath)) {
                unlink($oldImagePath);
            }
        }

        // Delete existing reference image if it exists (overwrite)
        if (file_exists($referenceImageFullPath)) {
            unlink($referenceImageFullPath);
        }

        // Native resolution for MindVision industrial camera
        $nativeWidth = 5488;
        $nativeHeight = 3672;

        // Copy the source image to the annotations folder
        $sourceImagePath = storage_path('app/public/' . $articleImage->image_path);
        $imageData = null;
        $imageMimeType = null;
        $webcamWidth = null;
        $webcamHeight = null;
        
        if (file_exists($sourceImagePath)) {
            // Get original webcam image dimensions
            $imageInfo = getimagesize($sourceImagePath);
            if ($imageInfo) {
                $webcamWidth = $imageInfo[0];
                $webcamHeight = $imageInfo[1];
            }
            
            // Copy the original image (Python will handle resolution matching)
            copy($sourceImagePath, $referenceImageFullPath);
            
            // Store image as base64 in database for Electron app access
            $imageContent = file_get_contents($sourceImagePath);
            $imageData = base64_encode($imageContent);
            
            // Detect MIME type from file extension
            $extension = strtolower(pathinfo($sourceImagePath, PATHINFO_EXTENSION));
            $mimeTypes = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
            ];
            $imageMimeType = $mimeTypes[$extension] ?? 'image/jpeg';
        }

        // Convert percentage-based annotations to pixel coordinates for measurement system
        // Scale from webcam resolution to native industrial camera resolution
        $scaleX = $webcamWidth ? $nativeWidth / $webcamWidth : 1;
        $scaleY = $webcamHeight ? $nativeHeight / $webcamHeight : 1;
        
        $keypointsPixels = [];  // Native resolution keypoints for storage
        $keypointsWebcam = [];  // Webcam resolution keypoints for distance calculation
        
        if ($webcamWidth && $webcamHeight && $request->annotations) {
            foreach ($request->annotations as $point) {
                // Convert percentage to webcam pixels
                $webcamX = ($point['x'] / 100) * $webcamWidth;
                $webcamY = ($point['y'] / 100) * $webcamHeight;
                
                // Store webcam-resolution keypoints for distance calculation
                // (calibration pixels_per_cm is based on webcam resolution)
                $keypointsWebcam[] = [$webcamX, $webcamY];
                
                // Scale to native resolution for storage (used by measurement system)
                $nativeX = (int) round($webcamX * $scaleX);
                $nativeY = (int) round($webcamY * $scaleY);
                
                $keypointsPixels[] = [$nativeX, $nativeY];
            }
        }

        // Auto-calculate target_distances from keypoint pairs and active calibration
        // IMPORTANT: Use webcam-resolution keypoints because pixels_per_cm was calibrated at webcam resolution
        // This matches the Python measurement system behavior
        $targetDistances = [];
        $pixelsPerCm = $activeCalibration->pixels_per_cm;
        
        if (count($keypointsWebcam) >= 2) {
            // Calculate distance for each pair (1-2, 3-4, 5-6, etc.)
            for ($i = 0; $i < count($keypointsWebcam) - 1; $i += 2) {
                $p1 = $keypointsWebcam[$i];
                $p2 = $keypointsWebcam[$i + 1];
                
                // Calculate Euclidean pixel distance at webcam resolution
                $pixelDistance = sqrt(pow($p2[0] - $p1[0], 2) + pow($p2[1] - $p1[1], 2));
                
                // Convert to cm using calibration (pixels_per_cm is at webcam resolution)
                $distanceCm = round($pixelDistance / $pixelsPerCm, 2);
                
                // Pair number (1-indexed)
                $pairNum = ($i / 2) + 1;
                $targetDistances[$pairNum] = $distanceCm;
            }
        }
        
        \Log::info('Auto-calculated target distances', [
            'pixels_per_cm' => $pixelsPerCm,
            'webcam_keypoints' => $keypointsWebcam,
            'native_keypoints' => $keypointsPixels,
            'target_distances' => $targetDistances
        ]);

        // Create or update the annotation in database
        // JSON data is stored in the 'annotations' column - no file needed
        // Image data is stored as base64 for centralized access
        // Store keypoints at native resolution for operator panel
        $annotation = ArticleAnnotation::updateOrCreate(
            [
                'article_style' => $article->article_style,
                'size' => $articleImage->size,
            ],
            [
                'article_id' => $article->id,
                'article_image_id' => $articleImage->id,
                'name' => $request->name ?? 'Annotation for ' . $article->article_style . ' - ' . $articleImage->size,
                'annotations' => $request->annotations,
                'keypoints_pixels' => $keypointsPixels,
                'target_distances' => $targetDistances,
                'image_width' => $nativeWidth,  // Store native resolution
                'image_height' => $nativeHeight, // Store native resolution
                'native_width' => $nativeWidth,
                'native_height' => $nativeHeight,
                'capture_source' => 'webcam',
                'capture_width' => $webcamWidth,
                'capture_height' => $webcamHeight,
                'reference_image_path' => $referenceImagePath,
                'image_data' => $imageData,
                'image_mime_type' => $imageMimeType,
                'json_file_path' => null, // No longer using JSON files
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Annotation saved successfully.',
            'annotation' => $annotation,
            'reference_image_path' => $referenceImagePath,
        ]);
    }

    /**
     * Get annotation for an image.
     */
    public function getAnnotation(Request $request, int $articleImageId): JsonResponse
    {
        $articleImage = ArticleImage::findOrFail($articleImageId);
        
        $annotation = ArticleAnnotation::where('article_image_id', $articleImageId)->first();

        if (!$annotation) {
            return response()->json([
                'success' => true,
                'annotation' => null,
                'message' => 'No annotation found for this image.',
            ]);
        }

        return response()->json([
            'success' => true,
            'annotation' => [
                'id' => $annotation->id,
                'name' => $annotation->name,
                'annotations' => $annotation->annotations,
                'target_distances' => $annotation->target_distances ?? [],
                'article_style' => $annotation->article_style,
                'size' => $annotation->size,
                'created_at' => $annotation->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $annotation->updated_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Delete annotation for an image.
     */
    public function deleteAnnotation(int $annotationId): JsonResponse
    {
        $annotation = ArticleAnnotation::findOrFail($annotationId);
        
        // Delete the reference image if it exists (flat structure)
        if ($annotation->reference_image_path) {
            $referenceImageFullPath = storage_path('app/public/' . $annotation->reference_image_path);
            if (file_exists($referenceImageFullPath)) {
                unlink($referenceImageFullPath);
            }
        }

        $annotation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Annotation deleted successfully.',
        ]);
    }

    /**
     * Get active camera calibration.
     */
    public function getCalibration(Request $request): JsonResponse
    {
        $calibration = CameraCalibration::getActive();

        if (!$calibration) {
            return response()->json([
                'success' => true,
                'calibration' => null,
                'message' => 'No active calibration found. Please calibrate the camera first.',
            ]);
        }

        return response()->json([
            'success' => true,
            'calibration' => [
                'id' => $calibration->id,
                'name' => $calibration->name,
                'pixels_per_cm' => $calibration->pixels_per_cm,
                'reference_length_cm' => $calibration->reference_length_cm,
                'pixel_distance' => $calibration->pixel_distance,
                'is_active' => $calibration->is_active,
                'created_at' => $calibration->created_at,
                'updated_at' => $calibration->updated_at,
            ],
        ]);
    }

    /**
     * Save camera calibration.
     */
    public function saveCalibration(Request $request): JsonResponse
    {
        \Log::info('Calibration save request received', [
            'has_name' => $request->has('name'),
            'has_points' => $request->has('calibration_points'),
            'has_reference' => $request->has('reference_length_cm'),
            'request_size' => strlen(json_encode($request->all())),
        ]);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'calibration_points' => 'required|array|size:2',
            'calibration_points.*' => 'required|array|size:2',
            'calibration_points.*.0' => 'required|numeric', // x coordinate
            'calibration_points.*.1' => 'required|numeric', // y coordinate
            'reference_length_cm' => 'required|numeric|min:0.1|max:1000',
        ]);

        \Log::info('Validation passed', ['validated' => $validated]);

        // Calibration points are stored as percentages (0-100)
        // We need to convert to pixels at webcam resolution to calculate pixels_per_cm
        // Webcam captures at 1920x1080 (this is what the calibration wizard uses)
        $webcamWidth = 1920;
        $webcamHeight = 1080;
        
        // Convert percentage points to pixel coordinates
        $point1 = $validated['calibration_points'][0];
        $point2 = $validated['calibration_points'][1];
        
        $pixel1X = ($point1[0] / 100) * $webcamWidth;
        $pixel1Y = ($point1[1] / 100) * $webcamHeight;
        $pixel2X = ($point2[0] / 100) * $webcamWidth;
        $pixel2Y = ($point2[1] / 100) * $webcamHeight;
        
        // Calculate actual pixel distance at webcam resolution
        $pixelDistance = sqrt(
            pow($pixel2X - $pixel1X, 2) + 
            pow($pixel2Y - $pixel1Y, 2)
        );

        // Calculate pixels per cm at webcam resolution
        // This is the scale factor used for measuring distances
        $pixelsPerCm = $pixelDistance / $validated['reference_length_cm'];
        
        \Log::info('Calibration calculation', [
            'point1_percent' => $point1,
            'point2_percent' => $point2,
            'point1_pixels' => [$pixel1X, $pixel1Y],
            'point2_pixels' => [$pixel2X, $pixel2Y],
            'pixel_distance' => $pixelDistance,
            'reference_length_cm' => $validated['reference_length_cm'],
            'pixels_per_cm' => $pixelsPerCm,
        ]);

        // Create new calibration
        $calibration = CameraCalibration::create([
            'name' => $validated['name'] ?? 'Calibration ' . date('Y-m-d H:i:s'),
            'pixels_per_cm' => $pixelsPerCm,
            'reference_length_cm' => $validated['reference_length_cm'],
            'pixel_distance' => (int) round($pixelDistance),
            'calibration_points' => $validated['calibration_points'],
            'calibration_image' => null, // Don't save image - not needed
            'is_active' => false, // Will be activated below
        ]);

        \Log::info('Calibration created', ['id' => $calibration->id]);

        // Set as active and deactivate others
        $calibration->setActive();

        return response()->json([
            'success' => true,
            'message' => 'Calibration saved successfully.',
            'calibration' => [
                'id' => $calibration->id,
                'name' => $calibration->name,
                'pixels_per_cm' => $calibration->pixels_per_cm,
                'reference_length_cm' => $calibration->reference_length_cm,
                'pixel_distance' => $calibration->pixel_distance,
            ],
        ]);
    }

    /**
     * Get all calibrations.
     */
    public function getCalibrations(Request $request): JsonResponse
    {
        $calibrations = CameraCalibration::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'calibrations' => $calibrations->map(function ($cal) {
                return [
                    'id' => $cal->id,
                    'name' => $cal->name,
                    'pixels_per_cm' => $cal->pixels_per_cm,
                    'reference_length_cm' => $cal->reference_length_cm,
                    'pixel_distance' => $cal->pixel_distance,
                    'is_active' => $cal->is_active,
                    'created_at' => $cal->created_at,
                    'updated_at' => $cal->updated_at,
                ];
            }),
        ]);
    }

    /**
     * Set a calibration as active.
     */
    public function setActiveCalibration(Request $request, int $calibrationId): JsonResponse
    {
        $calibration = CameraCalibration::findOrFail($calibrationId);
        $calibration->setActive();

        return response()->json([
            'success' => true,
            'message' => 'Calibration activated successfully.',
        ]);
    }

    /**
     * Delete a calibration.
     */
    public function deleteCalibration(int $calibrationId): JsonResponse
    {
        $calibration = CameraCalibration::findOrFail($calibrationId);
        
        // Prevent deleting active calibration if it's the only one
        if ($calibration->is_active) {
            $otherCalibrations = CameraCalibration::where('id', '!=', $calibrationId)->count();
            if ($otherCalibrations === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the only calibration. Create a new one first.',
                ], 422);
            }
            
            // Activate the most recent other calibration
            $nextCalibration = CameraCalibration::where('id', '!=', $calibrationId)
                ->latest()
                ->first();
            if ($nextCalibration) {
                $nextCalibration->setActive();
            }
        }

        $calibration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Calibration deleted successfully.',
        ]);
    }
}

