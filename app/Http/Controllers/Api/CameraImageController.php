<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Article;
use App\Models\ArticleImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CameraImageController extends Controller
{
    /**
     * Validate API key from request header.
     */
    private function validateApiKey(Request $request): ?ApiKey
    {
        $apiKey = $request->header('X-API-Key');
        
        if (!$apiKey) {
            return null;
        }
        
        return ApiKey::validate($apiKey);
    }

    /**
     * Upload an image from Python camera capture.
     * 
     * Expected headers:
     * - X-API-Key: Your API key
     * 
     * Expected body (form-data):
     * - article_id: int
     * - size: string (S, M, L, XL, XXL)
     * - image: file (the captured image)
     */
    public function upload(Request $request): JsonResponse
    {
        // Validate API key
        $validKey = $this->validateApiKey($request);
        if (!$validKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        // Validate request
        $request->validate([
            'article_id' => ['required', 'exists:articles,id'],
            'size' => ['required', 'string', 'in:S,M,L,XL,XXL'],
            'image' => ['required', 'file', 'max:20480'], // 20MB max for camera images
        ]);

        $article = Article::findOrFail($request->article_id);
        $file = $request->file('image');
        $originalName = $file->getClientOriginalName() ?: 'camera_capture.jpg';
        
        // Generate unique filename with timestamp
        $timestamp = now()->format('Ymd_His');
        $extension = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'jpg';
        $filename = "camera_{$timestamp}_" . Str::random(8) . '.' . $extension;
        $directory = 'article-images/' . $article->id;
        
        // Ensure directory exists
        $fullDirectory = storage_path('app/public/' . $directory);
        if (!is_dir($fullDirectory)) {
            mkdir($fullDirectory, 0755, true);
        }
        
        // Move the uploaded file
        $path = $directory . '/' . $filename;
        $file->move($fullDirectory, $filename);

        // Create database record
        $articleImage = ArticleImage::create([
            'article_id' => $article->id,
            'article_style' => $article->article_style,
            'size' => $request->input('size'),
            'image_path' => $path,
            'image_name' => $originalName,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded successfully from camera.',
            'image' => [
                'id' => $articleImage->id,
                'article_id' => $articleImage->article_id,
                'article_style' => $articleImage->article_style,
                'size' => $articleImage->size,
                'image_path' => $articleImage->image_path,
                'image_url' => url('storage/' . $articleImage->image_path),
                'created_at' => $articleImage->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Get all articles (for Python to list available articles).
     */
    public function getArticles(Request $request): JsonResponse
    {
        // Validate API key
        $validKey = $this->validateApiKey($request);
        if (!$validKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        $articles = Article::with('brand:id,name')
            ->select('id', 'article_style', 'brand_id', 'description')
            ->orderBy('article_style')
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'article_style' => $article->article_style,
                    'brand_name' => $article->brand->name ?? 'Unknown',
                    'description' => $article->description,
                ];
            });

        return response()->json([
            'success' => true,
            'articles' => $articles,
        ]);
    }

    /**
     * Get images for a specific article.
     */
    public function getArticleImages(Request $request, int $articleId): JsonResponse
    {
        // Validate API key
        $validKey = $this->validateApiKey($request);
        if (!$validKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        $article = Article::findOrFail($articleId);
        $images = ArticleImage::where('article_id', $articleId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($image) {
                return [
                    'id' => $image->id,
                    'size' => $image->size,
                    'image_path' => $image->image_path,
                    'image_url' => url('storage/' . $image->image_path),
                    'image_name' => $image->image_name,
                    'created_at' => $image->created_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'article' => [
                'id' => $article->id,
                'article_style' => $article->article_style,
            ],
            'images' => $images,
        ]);
    }

    /**
     * Test API connection.
     */
    public function ping(Request $request): JsonResponse
    {
        $validKey = $this->validateApiKey($request);
        
        return response()->json([
            'success' => true,
            'message' => 'API connection successful!',
            'authenticated' => $validKey !== null,
            'server_time' => now()->toISOString(),
        ]);
    }

    /**
     * Delete an image.
     */
    public function deleteImage(Request $request, int $imageId): JsonResponse
    {
        // Validate API key
        $validKey = $this->validateApiKey($request);
        if (!$validKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        $image = ArticleImage::find($imageId);
        
        if (!$image) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found.',
            ], 404);
        }

        // Delete the file from storage
        $fullPath = storage_path('app/public/' . $image->image_path);
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }

        // Delete from database
        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully.',
        ]);
    }

    /**
     * Get annotation by article style and size.
     * Used by Python script to check for existing annotations.
     */
    public function getAnnotation(Request $request, string $articleStyle, string $size): JsonResponse
    {
        // Validate API key
        $validKey = $this->validateApiKey($request);
        if (!$validKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        $annotation = \App\Models\ArticleAnnotation::where('article_style', $articleStyle)
            ->where('size', $size)
            ->first();

        if (!$annotation) {
            return response()->json([
                'success' => true,
                'annotation' => null,
                'message' => 'No annotation found for this article style and size.',
            ]);
        }

        return response()->json([
            'success' => true,
            'annotation' => [
                'id' => $annotation->id,
                'article_style' => $annotation->article_style,
                'size' => $annotation->size,
                'name' => $annotation->name,
                'annotations' => $annotation->annotations,
                'reference_image_path' => $annotation->reference_image_path,
                'json_file_path' => $annotation->json_file_path,
                'created_at' => $annotation->created_at->toISOString(),
                'updated_at' => $annotation->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Sync annotation from Python script.
     * The Python script saves files directly, this syncs the database.
     */
    public function syncAnnotation(Request $request): JsonResponse
    {
        // Validate API key
        $validKey = $this->validateApiKey($request);
        if (!$validKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        $request->validate([
            'article_style' => ['required', 'string'],
            'size' => ['required', 'string'],
            'annotations' => ['nullable', 'array'],
            'name' => ['nullable', 'string'],
        ]);

        $articleStyle = $request->article_style;
        $size = $request->size;

        // Find the article by style
        $article = Article::where('article_style', $articleStyle)->first();
        
        // Find the article image for this style and size
        $articleImage = null;
        if ($article) {
            $articleImage = ArticleImage::where('article_id', $article->id)
                ->where('size', $size)
                ->first();
        }

        // File paths based on naming convention
        $jsonPath = "annotations/{$articleStyle}/{$articleStyle}_{$size}.json";
        $referencePath = "annotations/{$articleStyle}/{$articleStyle}_{$size}.jpg";

        // Create or update annotation record
        $annotation = \App\Models\ArticleAnnotation::updateOrCreate(
            [
                'article_style' => $articleStyle,
                'size' => $size,
            ],
            [
                'article_id' => $article?->id,
                'article_image_id' => $articleImage?->id,
                'name' => $request->name ?? "Annotation for {$articleStyle} - {$size}",
                'annotations' => $request->annotations ?? [],
                'reference_image_path' => $referencePath,
                'json_file_path' => $jsonPath,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Annotation synced successfully.',
            'annotation' => [
                'id' => $annotation->id,
                'article_style' => $annotation->article_style,
                'size' => $annotation->size,
                'json_file_path' => $jsonPath,
                'reference_image_path' => $referencePath,
            ],
        ]);
    }

    /**
     * List all annotations.
     */
    public function listAnnotations(Request $request): JsonResponse
    {
        // Validate API key
        $validKey = $this->validateApiKey($request);
        if (!$validKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }

        $annotations = \App\Models\ArticleAnnotation::select(
            'id', 'article_style', 'size', 'name', 'reference_image_path', 'json_file_path', 'created_at', 'updated_at'
        )->orderBy('article_style')->orderBy('size')->get();

        return response()->json([
            'success' => true,
            'annotations' => $annotations,
            'total' => $annotations->count(),
        ]);
    }
}
