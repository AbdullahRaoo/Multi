<?php

namespace App\GraphQL\Queries;

use Illuminate\Support\Facades\DB;

class MeasurementResults
{
    public function __invoke($_, array $args): array
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('measurement_results')) {
                return [];
            }

            $query = DB::table('measurement_results');

            if (isset($args['purchase_order_article_id'])) {
                $query->where('purchase_order_article_id', $args['purchase_order_article_id']);
            }

            if (isset($args['measurement_id'])) {
                $query->where('measurement_id', $args['measurement_id']);
            }

            if (isset($args['size'])) {
                $query->where('size', $args['size']);
            }

            return $query->get()->map(fn ($row) => (array) $row)->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }
}
