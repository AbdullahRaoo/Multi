<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\UploadedAnnotation;
use App\Models\ArticleRegistrationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AnnotationUploadController extends Controller
{
    /**
     * Display the annotation upload page.
     */
    public function index(): InertiaResponse
    {
        $hasPassword = ArticleRegistrationSetting::getValue('password') !== null;
        
        // Get article styles for dropdown
        $articleStyles = Article::with('brand')
            ->orderBy('article_style')
            ->get()
            ->map(fn($article) => [
                'id' => $article->id,
                'article_style' => $article->article_style,
                'brand_name' => $article->brand?->name ?? 'Unknown',
            ]);
        
        return Inertia::render('annotation-upload/index', [
            'hasPassword' => $hasPassword,
            'articleStyles' => $articleStyles,
        ]);
    }

    /**
     * Verify password for access.
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
     * Get available sizes for an article.
     * Returns sizes from MeasurementSize table for this article.
     */
    public function getSizes(int $articleId): JsonResponse
    {
        $article = Article::findOrFail($articleId);
        
        // Get sizes from measurement sizes for this article
        $sizes = \App\Models\MeasurementSize::whereHas('measurement', function ($query) use ($articleId) {
            $query->where('article_id', $articleId);
        })
        ->distinct()
        ->pluck('size')
        ->filter()
        ->sort()
        ->values();

        return response()->json([
            'success' => true,
            'sizes' => $sizes,
            'article_style' => $article->article_style,
        ]);
    }

    /**
     * Upload annotation JSON and reference image.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'article_id' => ['required', 'integer', 'exists:articles,id'],
            'size' => ['required', 'string', 'max:50'],
            'side' => ['required', 'string', 'in:front,back'],
            'json_file' => ['required', 'file', 'mimes:json,txt', 'max:10240'], // 10MB max
            'reference_image' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:51200'], // 50MB max
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            // Get the article
            $article = Article::findOrFail($request->article_id);
            $articleStyle = $article->article_style;
            
            // Read and parse JSON file
            $jsonContent = file_get_contents($request->file('json_file')->getRealPath());
            $annotationData = json_decode($jsonContent, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid JSON file: ' . json_last_error_msg(),
                ], 422);
            }

            // Validate required JSON fields
            if (!isset($annotationData['keypoints']) || !is_array($annotationData['keypoints'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'JSON must contain a "keypoints" array.',
                ], 422);
            }

            // Process reference image
            $image = $request->file('reference_image');
            $size = $request->size;
            $side = $request->side; // Get the side parameter
            
            // Create storage directory
            $storageDir = 'uploaded-annotations';
            Storage::disk('public')->makeDirectory($storageDir);

            // Generate filename using UUID to allow same original filenames for front/back
            // UUID ensures no filename conflicts regardless of original file name
            $extension = $image->getClientOriginalExtension();
            $uuid = \Illuminate\Support\Str::uuid();
            $filename = $uuid . '_' . $side . '.' . $extension;
            $imagePath = $storageDir . '/' . $filename;

            // Check for existing annotation and delete old image
            $existing = UploadedAnnotation::findByArticleIdAndSize($article->id, $size, $side);
            if ($existing && $existing->reference_image_path) {
                Storage::disk('public')->delete($existing->reference_image_path);
            }

            // Store the image file (for Laravel API access)
            Storage::disk('public')->put($imagePath, file_get_contents($image->getRealPath()));

            // Read image as base64 for direct MySQL storage (for Operator Panel)
            $imageContent = file_get_contents($image->getRealPath());
            $imageBase64 = base64_encode($imageContent);

            // Get image dimensions
            $imageInfo = getimagesize($image->getRealPath());
            $imageWidth = $imageInfo[0] ?? null;
            $imageHeight = $imageInfo[1] ?? null;

            // Generate API URL for Electron app
            $apiImageUrl = '/api/uploaded-annotations/' . $articleStyle . '/' . $size . '/' . $side . '/image';

            // Extract annotation date if present in JSON
            $annotationDate = null;
            if (isset($annotationData['annotation_date'])) {
                try {
                    $annotationDate = \Carbon\Carbon::parse($annotationData['annotation_date']);
                } catch (\Exception $e) {
                    // Ignore invalid date
                }
            }

            // Create or update annotation record
            $annotation = UploadedAnnotation::updateOrCreate(
                [
                    'article_id' => $article->id,
                    'size' => $size,
                    'side' => $side,
                ],
                [
                    'article_style' => $articleStyle,
                    'name' => $request->name ?? 'Annotation for ' . $articleStyle . ' - ' . $size . ' (' . ucfirst($side) . ')',
                    'annotation_data' => $annotationData,
                    'reference_image_path' => $imagePath,
                    'reference_image_data' => $imageBase64,
                    'reference_image_filename' => $filename,
                    'reference_image_mime_type' => $image->getMimeType(),
                    'reference_image_size' => $image->getSize(),
                    'image_width' => $imageWidth,
                    'image_height' => $imageHeight,
                    'original_json_filename' => $request->file('json_file')->getClientOriginalName(),
                    'api_image_url' => $apiImageUrl,
                    'upload_source' => 'manual',
                    'annotation_date' => $annotationDate,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Annotation uploaded successfully.',
                'annotation' => [
                    'id' => $annotation->id,
                    'article_id' => $annotation->article_id,
                    'article_style' => $annotation->article_style,
                    'size' => $annotation->size,
                    'name' => $annotation->name,
                    'keypoints_count' => count($annotationData['keypoints']),
                    'target_distances_count' => count($annotationData['target_distances'] ?? []),
                    'image_url' => $annotation->api_image_url,
                    'image_dimensions' => $imageWidth . 'x' . $imageHeight,
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Annotation upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all uploaded annotations (for management).
     */
    public function getAnnotations(): JsonResponse
    {
        $annotations = UploadedAnnotation::with('article.brand')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'annotations' => $annotations->map(function ($a) {
                return [
                    'id' => $a->id,
                    'article_id' => $a->article_id,
                    'article_style' => $a->article_style,
                    'brand_name' => $a->article?->brand?->name,
                    'size' => $a->size,
                    'side' => $a->side,
                    'name' => $a->name,
                    'keypoints_count' => count($a->getKeypoints()),
                    'target_distances_count' => count($a->getTargetDistances()),
                    'image_url' => $a->api_image_url,
                    'image_dimensions' => ($a->image_width && $a->image_height) 
                        ? $a->image_width . 'x' . $a->image_height 
                        : null,
                    'annotation_date' => $a->annotation_date?->toIso8601String(),
                    'created_at' => $a->created_at->toIso8601String(),
                    'updated_at' => $a->updated_at->toIso8601String(),
                ];
            }),
        ]);
    }

    /**
     * Delete an uploaded annotation.
     */
    public function delete(int $id): JsonResponse
    {
        $annotation = UploadedAnnotation::findOrFail($id);

        // Delete the reference image
        if ($annotation->reference_image_path) {
            Storage::disk('public')->delete($annotation->reference_image_path);
        }

        $annotation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Annotation deleted successfully.',
        ]);
    }

    // ===== API ENDPOINTS FOR ELECTRON APP =====

    /**
     * API: Get all uploaded annotations.
     */
    public function apiGetAnnotations(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'annotations' => UploadedAnnotation::getAllForElectron(),
        ]);
    }

    /**
     * API: Get a single annotation by article style, size, and side.
     */
    public function apiGetAnnotation(string $articleStyle, string $size, string $side = 'front'): JsonResponse
    {
        $annotation = UploadedAnnotation::findByStyleAndSize($articleStyle, $size, $side);

        if (!$annotation) {
            return response()->json([
                'success' => false,
                'message' => 'Annotation not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'annotation' => [
                'id' => $annotation->id,
                'article_style' => $annotation->article_style,
                'size' => $annotation->size,
                'side' => $annotation->side,
                'name' => $annotation->name,
                'annotation_data' => $annotation->annotation_data,
                'reference_image_url' => $annotation->api_image_url,
                'image_width' => $annotation->image_width,
                'image_height' => $annotation->image_height,
                'annotation_date' => $annotation->annotation_date?->toIso8601String(),
                'created_at' => $annotation->created_at->toIso8601String(),
                'updated_at' => $annotation->updated_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * API: Get the reference image for an annotation.
     */
    public function apiGetImage(string $articleStyle, string $size, string $side = 'front'): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $annotation = UploadedAnnotation::findByStyleAndSize($articleStyle, $size, $side);

        if (!$annotation || !$annotation->reference_image_path) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found.',
            ], 404);
        }

        $path = $annotation->getStoragePath();

        if (!file_exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Image file not found on server.',
            ], 404);
        }

        return response()->file($path, [
            'Content-Type' => $annotation->reference_image_mime_type ?? 'image/jpeg',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    /**
     * API: Get the reference image as base64.
     */
    public function apiGetImageBase64(string $articleStyle, string $size, string $side = 'front'): JsonResponse
    {
        $annotation = UploadedAnnotation::findByStyleAndSize($articleStyle, $size, $side);

        if (!$annotation || !$annotation->reference_image_path) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found.',
            ], 404);
        }

        $path = $annotation->getStoragePath();

        if (!file_exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Image file not found on server.',
            ], 404);
        }

        $imageContent = file_get_contents($path);
        $base64 = base64_encode($imageContent);
        $mimeType = $annotation->reference_image_mime_type ?? 'image/jpeg';

        return response()->json([
            'success' => true,
            'image' => [
                'data' => $base64,
                'mime_type' => $mimeType,
                'data_url' => "data:{$mimeType};base64,{$base64}",
                'width' => $annotation->image_width,
                'height' => $annotation->image_height,
            ],
        ]);
    }
    /**
     * API: Get the reference image as base64 using query parameters.
     * Prevents issues with URL encoding of slashes in size.
     */
    public function apiGetImageBase64Query(Request $request): JsonResponse
    {
        $articleStyle = $request->query('article_style');
        $size = $request->query('size');

        if (!$articleStyle || !$size) {
            return response()->json([
                'success' => false,
                'message' => 'article_style and size parameters are required.',
            ], 400);
        }

        return $this->apiGetImageBase64($articleStyle, $size);
    }
}
