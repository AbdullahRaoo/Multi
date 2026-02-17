<?php

use App\Http\Controllers\Api\CameraImageController;
use App\Http\Controllers\Api\OperatorPanelController;
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

    // --- Operator Panel endpoints (OperatorPanelController) ---

    // Brands with active POs
    Route::get('/brands', [OperatorPanelController::class, 'getBrands']);

    // Article types (filtered by brand_id)
    Route::get('/article-types', [OperatorPanelController::class, 'getArticleTypes']);

    // Articles with brand + type filtering
    Route::get('/articles-filtered', [OperatorPanelController::class, 'getArticlesFiltered']);

    // Purchase orders (filtered by brand_id)
    Route::get('/purchase-orders', [OperatorPanelController::class, 'getPurchaseOrders']);

    // Articles in a purchase order
    Route::get('/po-articles', [OperatorPanelController::class, 'getPOArticles']);

    // Measurement specs (2-strategy lookup)
    Route::get('/measurement-specs', [OperatorPanelController::class, 'getMeasurementSpecs']);

    // Available sizes for an article
    Route::get('/available-sizes', [OperatorPanelController::class, 'getAvailableSizes']);

    // Measurement results (GET = load, POST = save/upsert)
    Route::get('/measurement-results', [OperatorPanelController::class, 'getMeasurementResults']);
    Route::post('/measurement-results', [OperatorPanelController::class, 'saveMeasurementResults']);

    // Detailed measurement results (per-side)
    Route::post('/measurement-results-detailed', [OperatorPanelController::class, 'saveMeasurementResultsDetailed']);

    // QC measurement sessions
    Route::post('/measurement-sessions', [OperatorPanelController::class, 'saveMeasurementSession']);

    // Operator PIN verification
    Route::post('/verify-pin', [OperatorPanelController::class, 'verifyPin']);
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
    // Operator Panel: fetch annotation + reference image with correct priority
    // Priority: uploaded_annotations > article_annotations (never article_images)
    Route::get('/operator-fetch', [\App\Http\Controllers\AnnotationUploadController::class, 'apiOperatorFetch']);
});
