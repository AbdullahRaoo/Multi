<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\ArticleType;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, Brand $brand): Response
    {
        $query = Article::where('brand_id', $brand->id)
            ->with(['articleType']);

        // Apply search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('article_style', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('articleType', function ($typeQuery) use ($search) {
                        $typeQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $articles = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('articles/index', [
            'brand' => $brand,
            'articles' => $articles,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Brand $brand): Response
    {
        $articleTypes = ArticleType::orderBy('name')->get();

        return Inertia::render('articles/create', [
            'brand' => $brand,
            'articleTypes' => $articleTypes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Brand $brand): RedirectResponse
    {
        $validated = $request->validate([
            'article_type_id' => ['required', 'integer', 'exists:article_types,id'],
            'article_style' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ], [
            'article_type_id.required' => 'Article type is required.',
            'article_type_id.exists' => 'Selected article type is invalid.',
            'article_style.required' => 'Article style is required.',
            'article_style.max' => 'Article style must not exceed 255 characters.',
        ]);

        Article::create([
            'brand_id' => $brand->id,
            'article_type_id' => (int) $validated['article_type_id'],
            'article_style' => $validated['article_style'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect(route('brands.show', $brand->id) . '?tab=articles')
            ->with('success', 'Article created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Brand $brand, Article $article): Response
    {
        $article->load(['articleType', 'brand', 'measurements.sizes']);

        return Inertia::render('articles/show', [
            'brand' => $brand,
            'article' => $article,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Brand $brand, Article $article): Response
    {
        $article->load(['articleType']);
        $articleTypes = ArticleType::orderBy('name')->get();

        return Inertia::render('articles/edit', [
            'brand' => $brand,
            'article' => $article,
            'articleTypes' => $articleTypes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Brand $brand, Article $article): RedirectResponse
    {
        $validated = $request->validate([
            'article_type_id' => ['required', 'integer', 'exists:article_types,id'],
            'article_style' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ], [
            'article_type_id.required' => 'Article type is required.',
            'article_type_id.exists' => 'Selected article type is invalid.',
            'article_style.required' => 'Article style is required.',
            'article_style.max' => 'Article style must not exceed 255 characters.',
        ]);

        $article->update([
            'article_type_id' => (int) $validated['article_type_id'],
            'article_style' => $validated['article_style'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect(route('brands.show', $brand->id) . '?tab=articles')
            ->with('success', 'Article updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Brand $brand, Article $article): RedirectResponse
    {
        $article->delete();

        return redirect(route('brands.show', $brand->id) . '?tab=articles')
            ->with('success', 'Article deleted successfully.');
    }
}
