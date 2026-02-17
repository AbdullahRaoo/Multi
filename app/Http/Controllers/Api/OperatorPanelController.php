<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Article;
use App\Models\ArticleType;
use App\Models\Brand;
use App\Models\Measurement;
use App\Models\MeasurementSize;
use App\Models\Operator;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderArticle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class OperatorPanelController extends Controller
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
     * Require a valid API key or return 401.
     */
    private function requireApiKey(Request $request): ?JsonResponse
    {
        if (!$this->validateApiKey($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or missing API key.',
            ], 401);
        }
        return null; // Auth OK
    }

    // =========================================================================
    // 1. GET /api/camera/brands — Brands with active purchase orders
    // =========================================================================
    public function getBrands(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $brands = Brand::whereHas('purchaseOrders', function ($q) {
                $q->where('status', 'active');
            })
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'brands' => $brands,
        ]);
    }

    // =========================================================================
    // 2. GET /api/camera/article-types?brand_id=X — Article types for a brand
    // =========================================================================
    public function getArticleTypes(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $brandId = $request->query('brand_id');

        $query = ArticleType::select('id', 'name')->orderBy('name');

        if ($brandId) {
            $query->whereHas('articles', function ($q) use ($brandId) {
                $q->where('brand_id', $brandId);
            });
        }

        return response()->json([
            'success' => true,
            'article_types' => $query->get(),
        ]);
    }

    // =========================================================================
    // 3. GET /api/camera/articles-filtered?brand_id=X&type_id=Y
    //    Enhanced article list with brand + type filtering
    // =========================================================================
    public function getArticlesFiltered(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $query = Article::with(['brand:id,name', 'articleType:id,name'])
            ->select('id', 'article_style', 'brand_id', 'article_type_id', 'description');

        if ($request->query('brand_id')) {
            $query->where('brand_id', $request->query('brand_id'));
        }

        if ($request->query('type_id')) {
            $query->where('article_type_id', $request->query('type_id'));
        }

        $articles = $query->orderBy('article_style')->get()->map(function ($article) {
            return [
                'id' => $article->id,
                'article_style' => $article->article_style,
                'brand_id' => $article->brand_id,
                'brand_name' => $article->brand->name ?? null,
                'article_type_id' => $article->article_type_id,
                'article_type_name' => $article->articleType->name ?? null,
                'description' => $article->description,
            ];
        });

        return response()->json([
            'success' => true,
            'articles' => $articles,
        ]);
    }

    // =========================================================================
    // 4. GET /api/camera/purchase-orders?brand_id=X — Active POs
    // =========================================================================
    public function getPurchaseOrders(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $query = PurchaseOrder::select('id', 'po_number', 'date', 'brand_id', 'country', 'status')
            ->where('status', 'active')
            ->orderBy('date', 'desc');

        if ($request->query('brand_id')) {
            $query->where('brand_id', $request->query('brand_id'));
        }

        $pos = $query->get()->map(function ($po) {
            return [
                'id' => $po->id,
                'po_number' => $po->po_number,
                'date' => $po->date?->toDateString(),
                'brand_id' => $po->brand_id,
                'country' => $po->country,
                'status' => $po->status,
            ];
        });

        return response()->json([
            'success' => true,
            'purchase_orders' => $pos,
        ]);
    }

    // =========================================================================
    // 5. GET /api/camera/po-articles?po_id=X — Articles in a purchase order
    // =========================================================================
    public function getPOArticles(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $poId = $request->query('po_id');
        if (!$poId) {
            return response()->json([
                'success' => false,
                'message' => 'po_id parameter is required.',
            ], 400);
        }

        $poArticles = PurchaseOrderArticle::where('purchase_order_id', $poId)
            ->with(['purchaseOrder:id,po_number', 'articleType:id,name'])
            ->get()
            ->map(function ($poa) {
                return [
                    'id' => $poa->id,
                    'purchase_order_id' => $poa->purchase_order_id,
                    'po_number' => $poa->purchaseOrder->po_number ?? null,
                    'article_type_id' => $poa->article_type_id,
                    'article_type_name' => $poa->articleType->name ?? null,
                    'article_style' => $poa->article_style,
                    'article_description' => $poa->article_description,
                    'article_color' => $poa->article_color,
                    'order_quantity' => $poa->order_quantity,
                ];
            });

        return response()->json([
            'success' => true,
            'po_articles' => $poArticles,
        ]);
    }

    // =========================================================================
    // 6. GET /api/camera/measurement-specs?article_id=X&size=Y
    //    2-strategy lookup: MeasurementSize first, then Measurement base values
    // =========================================================================
    public function getMeasurementSpecs(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $articleId = $request->query('article_id');
        $size = $request->query('size');

        if (!$articleId) {
            return response()->json([
                'success' => false,
                'message' => 'article_id parameter is required.',
            ], 400);
        }

        // Get all measurements for this article
        $measurements = Measurement::where('article_id', $articleId)
            ->select('id', 'article_id', 'code', 'measurement', 'tol_plus', 'tol_minus', 'side')
            ->orderBy('code')
            ->get();

        $specs = $measurements->map(function ($m) use ($size) {
            $expectedValue = null;

            // Strategy 1: Look for size-specific value in measurement_sizes
            if ($size) {
                $sizeRecord = MeasurementSize::where('measurement_id', $m->id)
                    ->where('size', $size)
                    ->first();

                if ($sizeRecord) {
                    $expectedValue = $sizeRecord->value;
                }
            }

            return [
                'measurement_id' => $m->id,
                'code' => $m->code,
                'measurement' => $m->measurement,
                'expected_value' => $expectedValue,
                'tol_plus' => $m->tol_plus,
                'tol_minus' => $m->tol_minus,
                'side' => $m->side,
            ];
        });

        return response()->json([
            'success' => true,
            'article_id' => (int) $articleId,
            'size' => $size,
            'specs' => $specs,
        ]);
    }

    // =========================================================================
    // 7. GET /api/camera/available-sizes?article_id=X
    // =========================================================================
    public function getAvailableSizes(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $articleId = $request->query('article_id');
        if (!$articleId) {
            return response()->json([
                'success' => false,
                'message' => 'article_id parameter is required.',
            ], 400);
        }

        $sizes = MeasurementSize::whereHas('measurement', function ($q) use ($articleId) {
                $q->where('article_id', $articleId);
            })
            ->select('size')
            ->distinct()
            ->orderBy('size')
            ->pluck('size');

        return response()->json([
            'success' => true,
            'article_id' => (int) $articleId,
            'sizes' => $sizes,
        ]);
    }

    // =========================================================================
    // 8. GET /api/camera/measurement-results?po_article_id=X&size=Y
    //    Load existing measurement results
    // =========================================================================
    public function getMeasurementResults(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $poArticleId = $request->query('po_article_id');
        $size = $request->query('size');

        if (!$poArticleId) {
            return response()->json([
                'success' => false,
                'message' => 'po_article_id parameter is required.',
            ], 400);
        }

        try {
            $query = DB::table('measurement_results')
                ->where('purchase_order_article_id', $poArticleId);

            if ($size) {
                $query->where('size', $size);
            }

            $results = $query->orderBy('measurement_id')->get();

            return response()->json([
                'success' => true,
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'results' => [],
                'note' => 'measurement_results table does not exist yet.',
            ]);
        }
    }

    // =========================================================================
    // 9. POST /api/camera/measurement-results — Save/upsert results (bulk)
    //    Body: { results: [{ purchase_order_article_id, measurement_id, size,
    //            article_style, measured_value, expected_value, tol_plus,
    //            tol_minus, status, operator_id }] }
    // =========================================================================
    public function saveMeasurementResults(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $request->validate([
            'results' => ['required', 'array', 'min:1'],
            'results.*.purchase_order_article_id' => ['required', 'integer'],
            'results.*.measurement_id' => ['required', 'integer'],
            'results.*.size' => ['required', 'string'],
        ]);

        $results = $request->input('results');

        try {
            // Ensure table exists
            if (!DB::getSchemaBuilder()->hasTable('measurement_results')) {
                // Create the table if it doesn't exist (first-time API usage)
                DB::statement("CREATE TABLE IF NOT EXISTS measurement_results (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    purchase_order_article_id BIGINT UNSIGNED NOT NULL,
                    measurement_id BIGINT UNSIGNED NOT NULL,
                    size VARCHAR(50) NOT NULL,
                    article_style VARCHAR(255) NULL,
                    measured_value DECIMAL(10,2) NULL,
                    expected_value DECIMAL(10,2) NULL,
                    tol_plus DECIMAL(10,2) NULL,
                    tol_minus DECIMAL(10,2) NULL,
                    status ENUM('PASS','FAIL','PENDING') DEFAULT 'PENDING',
                    operator_id BIGINT UNSIGNED NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY mr_unique (purchase_order_article_id, measurement_id, size),
                    FOREIGN KEY (purchase_order_article_id) REFERENCES purchase_order_articles(id) ON DELETE CASCADE,
                    FOREIGN KEY (measurement_id) REFERENCES measurements(id),
                    FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE SET NULL
                )");
            }

            DB::table('measurement_results')->upsert(
                array_map(function ($r) {
                    return [
                        'purchase_order_article_id' => $r['purchase_order_article_id'],
                        'measurement_id' => $r['measurement_id'],
                        'size' => $r['size'],
                        'article_style' => $r['article_style'] ?? null,
                        'measured_value' => $r['measured_value'] ?? null,
                        'expected_value' => $r['expected_value'] ?? null,
                        'tol_plus' => $r['tol_plus'] ?? null,
                        'tol_minus' => $r['tol_minus'] ?? null,
                        'status' => $r['status'] ?? 'PENDING',
                        'operator_id' => $r['operator_id'] ?? null,
                    ];
                }, $results),
                ['purchase_order_article_id', 'measurement_id', 'size'], // unique key columns
                ['measured_value', 'expected_value', 'tol_plus', 'tol_minus', 'status', 'operator_id', 'article_style'] // update columns
            );

            return response()->json([
                'success' => true,
                'message' => 'Measurement results saved successfully.',
                'count' => count($results),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save measurement results: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // 10. POST /api/camera/measurement-results-detailed
    //     Save per-side measurement results (DELETE + INSERT approach)
    //     Body: { purchase_order_article_id, size, side, results: [...] }
    // =========================================================================
    public function saveMeasurementResultsDetailed(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $request->validate([
            'purchase_order_article_id' => ['required', 'integer'],
            'size' => ['required', 'string'],
            'side' => ['required', 'string', 'in:front,back'],
            'results' => ['required', 'array', 'min:1'],
            'results.*.measurement_id' => ['required', 'integer'],
        ]);

        $poArticleId = $request->input('purchase_order_article_id');
        $size = $request->input('size');
        $side = $request->input('side');
        $results = $request->input('results');

        try {
            DB::beginTransaction();

            // Delete existing results for this combination
            DB::table('measurement_results_detailed')
                ->where('purchase_order_article_id', $poArticleId)
                ->where('size', $size)
                ->where('side', $side)
                ->delete();

            // Insert new results
            $rows = array_map(function ($r) use ($poArticleId, $size, $side) {
                return [
                    'purchase_order_article_id' => $poArticleId,
                    'measurement_id' => $r['measurement_id'],
                    'size' => $size,
                    'side' => $side,
                    'article_style' => $r['article_style'] ?? null,
                    'measured_value' => $r['measured_value'] ?? null,
                    'expected_value' => $r['expected_value'] ?? null,
                    'tol_plus' => $r['tol_plus'] ?? null,
                    'tol_minus' => $r['tol_minus'] ?? null,
                    'status' => $r['status'] ?? 'PENDING',
                    'operator_id' => $r['operator_id'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }, $results);

            DB::table('measurement_results_detailed')->insert($rows);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Detailed measurement results saved successfully.',
                'count' => count($rows),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to save detailed results: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // 11. POST /api/camera/measurement-sessions
    //     Save QC session record (upsert by purchase_order_article_id + size)
    //     Body: { purchase_order_article_id, size, ... }
    // =========================================================================
    public function saveMeasurementSession(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $request->validate([
            'purchase_order_article_id' => ['required', 'integer'],
            'size' => ['required', 'string'],
        ]);

        try {
            DB::table('measurement_sessions')->upsert(
                [[
                    'purchase_order_article_id' => $request->input('purchase_order_article_id'),
                    'size' => $request->input('size'),
                    'article_style' => $request->input('article_style'),
                    'article_id' => $request->input('article_id'),
                    'purchase_order_id' => $request->input('purchase_order_id'),
                    'operator_id' => $request->input('operator_id'),
                    'status' => $request->input('status', 'in_progress'),
                    'front_side_complete' => $request->input('front_side_complete', false),
                    'back_side_complete' => $request->input('back_side_complete', false),
                    'front_qc_result' => $request->input('front_qc_result'),
                    'back_qc_result' => $request->input('back_qc_result'),
                    'updated_at' => now(),
                ]],
                ['purchase_order_article_id', 'size'], // unique key
                [
                    'article_style', 'article_id', 'purchase_order_id', 'operator_id',
                    'status', 'front_side_complete', 'back_side_complete',
                    'front_qc_result', 'back_qc_result', 'updated_at',
                ] // update columns
            );

            return response()->json([
                'success' => true,
                'message' => 'Measurement session saved successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save session: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // 12. POST /api/camera/verify-pin — Operator PIN verification
    //     Body: { employee_id, pin }
    // =========================================================================
    public function verifyPin(Request $request): JsonResponse
    {
        if ($error = $this->requireApiKey($request)) return $error;

        $request->validate([
            'employee_id' => ['required', 'string'],
            'pin' => ['required', 'string'],
        ]);

        $operator = Operator::where('employee_id', $request->input('employee_id'))->first();

        if (!$operator) {
            return response()->json([
                'success' => false,
                'message' => 'Operator not found.',
            ], 404);
        }

        // Check PIN — supports both bcrypt-hashed and plain-text PINs
        $pinMatch = false;
        $storedPin = $operator->login_pin;

        if (str_starts_with($storedPin, '$2y$') || str_starts_with($storedPin, '$2a$')) {
            // Bcrypt hash
            $pinMatch = Hash::check($request->input('pin'), $storedPin);
        } else {
            // Plain text comparison (legacy)
            $pinMatch = $storedPin === $request->input('pin');
        }

        if (!$pinMatch) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'PIN verified successfully.',
            'operator' => [
                'id' => $operator->id,
                'full_name' => $operator->full_name,
                'employee_id' => $operator->employee_id,
                'department' => $operator->department,
            ],
        ]);
    }
}
