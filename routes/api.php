<?php

use App\Http\Controllers\Api\CameraImageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Camera API routes (protected by API key in controller)
Route::prefix('camera')->group(function () {
    // Test connection
    Route::get('/ping', [CameraImageController::class, 'ping']);
    
    // Upload image from camera
    Route::post('/upload', [CameraImageController::class, 'upload']);
    
    // Get list of articles
    Route::get('/articles', [CameraImageController::class, 'getArticles']);
    
    // Get images for an article
    Route::get('/articles/{articleId}/images', [CameraImageController::class, 'getArticleImages']);
    
    // Delete an image
    Route::delete('/images/{imageId}', [CameraImageController::class, 'deleteImage']);
});

// Annotation API routes (protected by API key in controller)
Route::prefix('annotations')->group(function () {
    // Get annotation by article style and size
    Route::get('/{articleStyle}/{size}', [CameraImageController::class, 'getAnnotation']);
    
    // Sync annotation from Python script (files are saved by Python, this syncs DB)
    Route::post('/sync', [CameraImageController::class, 'syncAnnotation']);
    
    // List all annotations
    Route::get('/', [CameraImageController::class, 'listAnnotations']);
});

// Uploaded Annotations API routes (for Electron app - protected by API key in controller)
Route::prefix('uploaded-annotations')->group(function () {
    // List all uploaded annotations
    Route::get('/', [\App\Http\Controllers\AnnotationUploadController::class, 'apiGetAnnotations']);
    
    // Get single annotation data
    Route::get('/{articleStyle}/{size}/{side}', [\App\Http\Controllers\AnnotationUploadController::class, 'apiGetAnnotation']);
    
    // Get annotation reference image (returns file)
    Route::get('/{articleStyle}/{size}/{side}/image', [\App\Http\Controllers\AnnotationUploadController::class, 'apiGetImage']);
    
    // Get annotation reference image as base64
    Route::get('/{articleStyle}/{size}/{side}/image-base64', [\App\Http\Controllers\AnnotationUploadController::class, 'apiGetImageBase64']);

    // New safe route using query parameters
    Route::get('/fetch-image-base64', [\App\Http\Controllers\AnnotationUploadController::class, 'apiGetImageBase64Query']);
});
