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
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('operators', \App\Http\Controllers\OperatorController::class);
    Route::resource('brands', \App\Http\Controllers\BrandController::class);
    
    // Articles nested under brands
    Route::prefix('brands/{brand}')->group(function () {
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
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
