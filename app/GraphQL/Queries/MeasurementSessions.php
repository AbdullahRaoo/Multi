<?php

namespace App\GraphQL\Queries;

use Illuminate\Support\Facades\DB;

class MeasurementSessions
{
    public function __invoke($_, array $args): array
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable('measurement_sessions')) {
                return [];
            }

            $query = DB::table('measurement_sessions');

            if (isset($args['purchase_order_article_id'])) {
                $query->where('purchase_order_article_id', $args['purchase_order_article_id']);
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
