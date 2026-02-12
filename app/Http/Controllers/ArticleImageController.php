<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\ArticleImage;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ArticleImageController extends Controller
{
    /**
     * Get all images for an article.
     */
    public function index(Brand $brand, Article $article): JsonResponse
    {
        $images = $article->images()->latest()->get();

        return response()->json($images);
    }

    /**
     * Store a newly created image.
     */
    public function store(Request $request, Brand $brand, Article $article): JsonResponse
    {
        $request->validate([
            'size' => ['required', 'string', 'in:S,M,L,XL,XXL'],
            'image' => ['required', 'file', 'max:10240'], // 10MB max
        ], [
            'size.required' => 'Size is required.',
            'size.in' => 'Size must be one of: S, M, L, XL, XXL.',
            'image.required' => 'Image is required.',
            'image.file' => 'The file must be a valid file.',
            'image.max' => 'Image size must not exceed 10MB.',
        ]);

        $file = $request->file('image');
        $originalName = $file->getClientOriginalName();
        
        // Generate unique filename
        $extension = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'jpg';
        $filename = Str::uuid() . '.' . $extension;
        $directory = 'article-images/' . $article->id;
        
        // Ensure directory exists
        $fullDirectory = storage_path('app/public/' . $directory);
        if (!is_dir($fullDirectory)) {
            mkdir($fullDirectory, 0755, true);
        }
        
        // Move the uploaded file directly (memory efficient)
        $path = $directory . '/' . $filename;
        $file->move($fullDirectory, $filename);

        $articleImage = ArticleImage::create([
            'article_id' => $article->id,
            'article_style' => $article->article_style,
            'size' => $request->input('size'),
            'image_path' => $path,
            'image_name' => $originalName,
        ]);

        return response()->json([
            'message' => 'Image uploaded successfully.',
            'image' => $articleImage,
        ], 201);
    }

    /**
     * Remove the specified image.
     */
    public function destroy(Brand $brand, Article $article, ArticleImage $image): JsonResponse
    {
        // Delete the file from storage
        if (Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        return response()->json([
            'message' => 'Image deleted successfully.',
        ]);
    }
}
