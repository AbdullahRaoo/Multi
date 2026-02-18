<?php

namespace App\GraphQL\Queries;

use Illuminate\Support\Facades\DB;

class MeasurementResultsDetailed
{
    public function __invoke($_, array $args): array
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('measurement_results_detailed')) {
                return [];
            }

            $query = DB::table('measurement_results_detailed');

            if (isset($args['purchase_order_article_id'])) {
                $query->where('purchase_order_article_id', $args['purchase_order_article_id']);
            }

            if (isset($args['size'])) {
                $query->where('size', $args['size']);
            }

            if (isset($args['side'])) {
                $query->where('side', $args['side']);
            }

            return $query->get()->map(fn ($row) => (array) $row)->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }
}
