<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Brand;
use App\Models\Measurement;
use App\Models\MeasurementSize;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MeasurementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, Brand $brand, Article $article): Response
    {
        $query = $article->measurements();

        // Apply search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('measurement', 'like', "%{$search}%");
            });
        }

        $measurements = $query->with('sizes')->latest()->paginate(15)->withQueryString();

        return Inertia::render('measurements/index', [
            'brand' => $brand,
            'article' => $article,
            'measurements' => $measurements,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Brand $brand, Article $article): Response
    {
        return Inertia::render('measurements/create', [
            'brand' => $brand,
            'article' => $article,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Brand $brand, Article $article): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
            'measurement' => ['required', 'string', 'max:255'],
            'tol_plus' => ['nullable', 'numeric'],
            'tol_minus' => ['nullable', 'numeric'],
            'sizes' => ['required', 'array', 'min:1'],
            'sizes.*.size' => ['required', 'string', 'max:255'],
            'sizes.*.value' => ['required', 'numeric'],
            'sizes.*.unit' => ['required', 'string', 'in:cm,inches'],
        ], [
            'code.required' => 'Code is required.',
            'measurement.required' => 'Measurement is required.',
            'sizes.required' => 'At least one size section is required.',
            'sizes.min' => 'At least one size section is required.',
            'sizes.*.size.required' => 'Size is required for all size sections.',
            'sizes.*.value.required' => 'Value is required for all size sections.',
            'sizes.*.value.numeric' => 'Value must be a number.',
            'sizes.*.unit.required' => 'Unit is required for all size sections.',
            'sizes.*.unit.in' => 'Unit must be either cm or inches.',
        ]);

        $measurement = $article->measurements()->create([
            'code' => $validated['code'],
            'measurement' => $validated['measurement'],
            'tol_plus' => $validated['tol_plus'] ?? null,
            'tol_minus' => $validated['tol_minus'] ?? null,
        ]);

        foreach ($validated['sizes'] as $sizeData) {
            $measurement->sizes()->create([
                'size' => $sizeData['size'],
                'value' => $sizeData['value'],
                'unit' => $sizeData['unit'],
            ]);
        }

        return redirect()->route('brands.articles.show', [$brand->id, $article->id])
            ->with('success', 'Measurement created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Brand $brand, Article $article, Measurement $measurement): Response
    {
        $measurement->load('sizes');

        return Inertia::render('measurements/show', [
            'brand' => $brand,
            'article' => $article,
            'measurement' => $measurement,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Brand $brand, Article $article, Measurement $measurement): Response
    {
        $measurement->load('sizes');

        return Inertia::render('measurements/edit', [
            'brand' => $brand,
            'article' => $article,
            'measurement' => $measurement,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Brand $brand, Article $article, Measurement $measurement): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
            'measurement' => ['required', 'string', 'max:255'],
            'tol_plus' => ['nullable', 'numeric'],
            'tol_minus' => ['nullable', 'numeric'],
            'sizes' => ['required', 'array', 'min:1'],
            'sizes.*.size' => ['required', 'string', 'max:255'],
            'sizes.*.value' => ['required', 'numeric'],
            'sizes.*.unit' => ['required', 'string', 'in:cm,inches'],
        ], [
            'code.required' => 'Code is required.',
            'measurement.required' => 'Measurement is required.',
            'sizes.required' => 'At least one size section is required.',
            'sizes.min' => 'At least one size section is required.',
            'sizes.*.size.required' => 'Size is required for all size sections.',
            'sizes.*.value.required' => 'Value is required for all size sections.',
            'sizes.*.value.numeric' => 'Value must be a number.',
            'sizes.*.unit.required' => 'Unit is required for all size sections.',
            'sizes.*.unit.in' => 'Unit must be either cm or inches.',
        ]);

        $measurement->update([
            'code' => $validated['code'],
            'measurement' => $validated['measurement'],
            'tol_plus' => $validated['tol_plus'] ?? null,
            'tol_minus' => $validated['tol_minus'] ?? null,
        ]);

        // Delete existing sizes and create new ones
        $measurement->sizes()->delete();
        foreach ($validated['sizes'] as $sizeData) {
            $measurement->sizes()->create([
                'size' => $sizeData['size'],
                'value' => $sizeData['value'],
                'unit' => $sizeData['unit'],
            ]);
        }

        return redirect()->route('brands.articles.show', [$brand->id, $article->id])
            ->with('success', 'Measurement updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Brand $brand, Article $article, Measurement $measurement): RedirectResponse
    {
        $measurement->delete();

        return redirect()->route('brands.articles.show', [$brand->id, $article->id])
            ->with('success', 'Measurement deleted successfully.');
    }
}
