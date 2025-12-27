<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Handle GET requests to Boost browser-logs route (browser prefetch, extensions, etc.)
// Returns 405 Method Not Allowed with Allow header indicating POST is supported
Route::get('/_boost/browser-logs', function () {
    return response()->json([
        'status' => 'error',
        'message' => 'Method not allowed. Use POST method to submit logs.'
    ], 405)->header('Allow', 'POST');
})->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        $totalPurchaseOrders = \App\Models\PurchaseOrder::count();
        
        return Inertia::render('dashboard', [
            'totalPurchaseOrders' => $totalPurchaseOrders,
        ]);
    })->name('dashboard');

    Route::resource('operators', \App\Http\Controllers\OperatorController::class);
    Route::resource('brands', \App\Http\Controllers\BrandController::class);
    Route::resource('purchase-orders', \App\Http\Controllers\PurchaseOrderController::class);
    
    // Articles nested under brands
    Route::prefix('brands/{brand}')->group(function () {
        // Get articles for a brand (for auto-populating in purchase orders)
        Route::get('articles-for-po', [\App\Http\Controllers\PurchaseOrderController::class, 'getBrandArticles'])
            ->name('brands.articles.for-po');
        
        Route::get('articles', [\App\Http\Controllers\ArticleController::class, 'index'])
            ->name('brands.articles.index');
        Route::get('articles/create', [\App\Http\Controllers\ArticleController::class, 'create'])
            ->name('brands.articles.create');
        Route::post('articles', [\App\Http\Controllers\ArticleController::class, 'store'])
            ->name('brands.articles.store');
        Route::get('articles/{article}', [\App\Http\Controllers\ArticleController::class, 'show'])
            ->name('brands.articles.show');
        Route::get('articles/{article}/edit', [\App\Http\Controllers\ArticleController::class, 'edit'])
            ->name('brands.articles.edit');
        Route::put('articles/{article}', [\App\Http\Controllers\ArticleController::class, 'update'])
            ->name('brands.articles.update');
        Route::delete('articles/{article}', [\App\Http\Controllers\ArticleController::class, 'destroy'])
            ->name('brands.articles.destroy');

        // Measurements nested under articles
        Route::prefix('articles/{article}')->group(function () {
            Route::get('measurements', [\App\Http\Controllers\MeasurementController::class, 'index'])
                ->name('brands.articles.measurements.index');
            Route::get('measurements/create', [\App\Http\Controllers\MeasurementController::class, 'create'])
                ->name('brands.articles.measurements.create');
            Route::post('measurements', [\App\Http\Controllers\MeasurementController::class, 'store'])
                ->name('brands.articles.measurements.store');
            Route::get('measurements/{measurement}', [\App\Http\Controllers\MeasurementController::class, 'show'])
                ->name('brands.articles.measurements.show');
            Route::get('measurements/{measurement}/edit', [\App\Http\Controllers\MeasurementController::class, 'edit'])
                ->name('brands.articles.measurements.edit');
            Route::put('measurements/{measurement}', [\App\Http\Controllers\MeasurementController::class, 'update'])
                ->name('brands.articles.measurements.update');
            Route::delete('measurements/{measurement}', [\App\Http\Controllers\MeasurementController::class, 'destroy'])
                ->name('brands.articles.measurements.destroy');
        });
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
