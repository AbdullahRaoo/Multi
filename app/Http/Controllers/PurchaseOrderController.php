<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\ArticleType;
use App\Models\Brand;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderArticle;
use App\Models\PurchaseOrderClientReference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = PurchaseOrder::with(['brand']);

        // Apply search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhere('country', 'like', "%{$search}%")
                    ->orWhereHas('brand', function ($brandQuery) use ($search) {
                        $brandQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $purchaseOrders = $query->latest('date')->paginate(15)->withQueryString();

        return Inertia::render('purchase-orders/index', [
            'purchaseOrders' => $purchaseOrders,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $brands = Brand::orderBy('name')->get();
        $articleTypes = ArticleType::orderBy('name')->get();

        return Inertia::render('purchase-orders/create', [
            'brands' => $brands,
            'articleTypes' => $articleTypes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'po_number' => ['required', 'string', 'max:255', 'unique:purchase_orders,po_number'],
            'date' => ['required', 'date'],
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'country' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:Active,Pending,Completed'],
            'articles' => ['required', 'array', 'min:1'],
            'articles.*.article_type_id' => ['required', 'integer', 'exists:article_types,id'],
            'articles.*.article_style' => ['required', 'string', 'max:255'],
            'articles.*.article_description' => ['nullable', 'string'],
            'articles.*.article_color' => ['nullable', 'string', 'max:255'],
            'articles.*.order_quantity' => ['required', 'integer', 'min:1'],
            'client_references' => ['required', 'array', 'min:1'],
            'client_references.*.reference_name' => ['required', 'string', 'max:255'],
            'client_references.*.reference_number' => ['nullable', 'string', 'max:255'],
            'client_references.*.reference_email_address' => ['nullable', 'email', 'max:255'],
            'client_references.*.email_subject' => ['nullable', 'string', 'max:255'],
            'client_references.*.email_date' => ['nullable', 'date'],
        ], [
            'po_number.required' => 'PO Number is required.',
            'po_number.unique' => 'This PO Number already exists.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date.',
            'brand_id.required' => 'Brand is required.',
            'brand_id.exists' => 'Selected brand is invalid.',
            'country.required' => 'Country is required.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be Active, Pending, or Completed.',
            'articles.required' => 'At least one article is required.',
            'articles.min' => 'At least one article is required.',
            'articles.*.article_type_id.required' => 'Article type is required for all articles.',
            'articles.*.article_style.required' => 'Article style is required for all articles.',
            'articles.*.order_quantity.required' => 'Order quantity is required for all articles.',
            'articles.*.order_quantity.min' => 'Order quantity must be at least 1.',
            'client_references.required' => 'At least one client reference is required.',
            'client_references.min' => 'At least one client reference is required.',
            'client_references.*.reference_name.required' => 'Reference name is required for all client references.',
            'client_references.*.reference_email_address.email' => 'Reference email must be a valid email address.',
        ]);

        $purchaseOrder = PurchaseOrder::create([
            'po_number' => $validated['po_number'],
            'date' => $validated['date'],
            'brand_id' => $validated['brand_id'],
            'country' => $validated['country'],
            'status' => $validated['status'],
        ]);

        // Create articles
        foreach ($validated['articles'] as $articleData) {
            $purchaseOrder->articles()->create([
                'article_type_id' => $articleData['article_type_id'],
                'article_style' => $articleData['article_style'],
                'article_description' => $articleData['article_description'] ?? null,
                'article_color' => $articleData['article_color'] ?? null,
                'order_quantity' => $articleData['order_quantity'],
            ]);
        }

        // Create client references
        foreach ($validated['client_references'] as $referenceData) {
            $purchaseOrder->clientReferences()->create([
                'reference_name' => $referenceData['reference_name'],
                'reference_number' => $referenceData['reference_number'] ?? null,
                'reference_email_address' => $referenceData['reference_email_address'] ?? null,
                'email_subject' => $referenceData['email_subject'] ?? null,
                'email_date' => $referenceData['email_date'] ?? null,
            ]);
        }

        return redirect()->route('purchase-orders.index')
            ->with('success', 'Purchase Order created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load(['brand', 'articles.articleType', 'clientReferences']);

        return Inertia::render('purchase-orders/show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load(['brand', 'articles.articleType', 'clientReferences']);
        $brands = Brand::orderBy('name')->get();
        $articleTypes = ArticleType::orderBy('name')->get();

        return Inertia::render('purchase-orders/edit', [
            'purchaseOrder' => $purchaseOrder,
            'brands' => $brands,
            'articleTypes' => $articleTypes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $validated = $request->validate([
            'po_number' => ['required', 'string', 'max:255', 'unique:purchase_orders,po_number,' . $purchaseOrder->id],
            'date' => ['required', 'date'],
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
            'country' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:Active,Pending,Completed'],
            'articles' => ['required', 'array', 'min:1'],
            'articles.*.article_type_id' => ['required', 'integer', 'exists:article_types,id'],
            'articles.*.article_style' => ['required', 'string', 'max:255'],
            'articles.*.article_description' => ['nullable', 'string'],
            'articles.*.article_color' => ['nullable', 'string', 'max:255'],
            'articles.*.order_quantity' => ['required', 'integer', 'min:1'],
            'client_references' => ['required', 'array', 'min:1'],
            'client_references.*.reference_name' => ['required', 'string', 'max:255'],
            'client_references.*.reference_number' => ['nullable', 'string', 'max:255'],
            'client_references.*.reference_email_address' => ['nullable', 'email', 'max:255'],
            'client_references.*.email_subject' => ['nullable', 'string', 'max:255'],
            'client_references.*.email_date' => ['nullable', 'date'],
        ], [
            'po_number.required' => 'PO Number is required.',
            'po_number.unique' => 'This PO Number already exists.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date.',
            'brand_id.required' => 'Brand is required.',
            'brand_id.exists' => 'Selected brand is invalid.',
            'country.required' => 'Country is required.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be Active, Pending, or Completed.',
            'articles.required' => 'At least one article is required.',
            'articles.min' => 'At least one article is required.',
            'articles.*.article_type_id.required' => 'Article type is required for all articles.',
            'articles.*.article_style.required' => 'Article style is required for all articles.',
            'articles.*.order_quantity.required' => 'Order quantity is required for all articles.',
            'articles.*.order_quantity.min' => 'Order quantity must be at least 1.',
            'client_references.required' => 'At least one client reference is required.',
            'client_references.min' => 'At least one client reference is required.',
            'client_references.*.reference_name.required' => 'Reference name is required for all client references.',
            'client_references.*.reference_email_address.email' => 'Reference email must be a valid email address.',
        ]);

        $purchaseOrder->update([
            'po_number' => $validated['po_number'],
            'date' => $validated['date'],
            'brand_id' => $validated['brand_id'],
            'country' => $validated['country'],
            'status' => $validated['status'],
        ]);

        // Delete existing articles and create new ones
        $purchaseOrder->articles()->delete();
        foreach ($validated['articles'] as $articleData) {
            $purchaseOrder->articles()->create([
                'article_type_id' => $articleData['article_type_id'],
                'article_style' => $articleData['article_style'],
                'article_description' => $articleData['article_description'] ?? null,
                'article_color' => $articleData['article_color'] ?? null,
                'order_quantity' => $articleData['order_quantity'],
            ]);
        }

        // Delete existing client references and create new ones
        $purchaseOrder->clientReferences()->delete();
        foreach ($validated['client_references'] as $referenceData) {
            $purchaseOrder->clientReferences()->create([
                'reference_name' => $referenceData['reference_name'],
                'reference_number' => $referenceData['reference_number'] ?? null,
                'reference_email_address' => $referenceData['reference_email_address'] ?? null,
                'email_subject' => $referenceData['email_subject'] ?? null,
                'email_date' => $referenceData['email_date'] ?? null,
            ]);
        }

        return redirect()->route('purchase-orders.index')
            ->with('success', 'Purchase Order updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $purchaseOrder->delete();

        return redirect()->route('purchase-orders.index')
            ->with('success', 'Purchase Order deleted successfully.');
    }

    /**
     * Get articles for a brand (for auto-populating article style and description).
     */
    public function getBrandArticles(Request $request, Brand $brand)
    {
        $articles = $brand->articles()
            ->with('articleType')
            ->orderBy('article_style')
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'article_style' => $article->article_style,
                    'article_description' => $article->description,
                    'article_type_id' => $article->article_type_id,
                    'article_type_name' => $article->articleType->name ?? null,
                ];
            });

        return response()->json($articles);
    }
}
