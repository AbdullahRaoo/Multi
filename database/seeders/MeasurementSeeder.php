<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Measurement;
use App\Models\MeasurementSize;
use Illuminate\Database\Seeder;

class MeasurementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $articles = Article::with('brand')->get();

        if ($articles->isEmpty()) {
            $this->command->warn('No articles found. Please run ArticleSeeder first.');
            return;
        }

        $measurementTemplates = [
            // T-Shirt measurements
            [
                'article_type_pattern' => 'T-Shirt',
                'measurements' => [
                    [
                        'code' => 'CHEST',
                        'measurement' => 'Chest Width',
                        'tol_plus' => 1.0,
                        'tol_minus' => 1.0,
                        'sizes' => [
                            ['size' => 'S', 'value' => 48.0, 'unit' => 'cm'],
                            ['size' => 'M', 'value' => 52.0, 'unit' => 'cm'],
                            ['size' => 'L', 'value' => 56.0, 'unit' => 'cm'],
                            ['size' => 'XL', 'value' => 60.0, 'unit' => 'cm'],
                            ['size' => 'XXL', 'value' => 64.0, 'unit' => 'cm'],
                        ],
                    ],
                    [
                        'code' => 'LENGTH',
                        'measurement' => 'Body Length',
                        'tol_plus' => 1.5,
                        'tol_minus' => 1.5,
                        'sizes' => [
                            ['size' => 'S', 'value' => 68.0, 'unit' => 'cm'],
                            ['size' => 'M', 'value' => 71.0, 'unit' => 'cm'],
                            ['size' => 'L', 'value' => 74.0, 'unit' => 'cm'],
                            ['size' => 'XL', 'value' => 77.0, 'unit' => 'cm'],
                            ['size' => 'XXL', 'value' => 80.0, 'unit' => 'cm'],
                        ],
                    ],
                    [
                        'code' => 'SHOULDER',
                        'measurement' => 'Shoulder Width',
                        'tol_plus' => 0.5,
                        'tol_minus' => 0.5,
                        'sizes' => [
                            ['size' => 'S', 'value' => 42.0, 'unit' => 'cm'],
                            ['size' => 'M', 'value' => 44.0, 'unit' => 'cm'],
                            ['size' => 'L', 'value' => 46.0, 'unit' => 'cm'],
                            ['size' => 'XL', 'value' => 48.0, 'unit' => 'cm'],
                            ['size' => 'XXL', 'value' => 50.0, 'unit' => 'cm'],
                        ],
                    ],
                ],
            ],
            // Polo Shirt measurements
            [
                'article_type_pattern' => 'Polo Shirt',
                'measurements' => [
                    [
                        'code' => 'CHEST',
                        'measurement' => 'Chest Width',
                        'tol_plus' => 1.0,
                        'tol_minus' => 1.0,
                        'sizes' => [
                            ['size' => 'S', 'value' => 50.0, 'unit' => 'cm'],
                            ['size' => 'M', 'value' => 54.0, 'unit' => 'cm'],
                            ['size' => 'L', 'value' => 58.0, 'unit' => 'cm'],
                            ['size' => 'XL', 'value' => 62.0, 'unit' => 'cm'],
                            ['size' => 'XXL', 'value' => 66.0, 'unit' => 'cm'],
                        ],
                    ],
                    [
                        'code' => 'LENGTH',
                        'measurement' => 'Body Length',
                        'tol_plus' => 1.5,
                        'tol_minus' => 1.5,
                        'sizes' => [
                            ['size' => 'S', 'value' => 70.0, 'unit' => 'cm'],
                            ['size' => 'M', 'value' => 73.0, 'unit' => 'cm'],
                            ['size' => 'L', 'value' => 76.0, 'unit' => 'cm'],
                            ['size' => 'XL', 'value' => 79.0, 'unit' => 'cm'],
                            ['size' => 'XXL', 'value' => 82.0, 'unit' => 'cm'],
                        ],
                    ],
                ],
            ],
            // Trouser measurements
            [
                'article_type_pattern' => 'Trouser',
                'measurements' => [
                    [
                        'code' => 'WAIST',
                        'measurement' => 'Waist Width',
                        'tol_plus' => 1.0,
                        'tol_minus' => 1.0,
                        'sizes' => [
                            ['size' => 'S', 'value' => 76.0, 'unit' => 'cm'],
                            ['size' => 'M', 'value' => 82.0, 'unit' => 'cm'],
                            ['size' => 'L', 'value' => 88.0, 'unit' => 'cm'],
                            ['size' => 'XL', 'value' => 94.0, 'unit' => 'cm'],
                            ['size' => 'XXL', 'value' => 100.0, 'unit' => 'cm'],
                        ],
                    ],
                    [
                        'code' => 'INSEAM',
                        'measurement' => 'Inseam Length',
                        'tol_plus' => 1.0,
                        'tol_minus' => 1.0,
                        'sizes' => [
                            ['size' => 'S', 'value' => 76.0, 'unit' => 'cm'],
                            ['size' => 'M', 'value' => 78.0, 'unit' => 'cm'],
                            ['size' => 'L', 'value' => 80.0, 'unit' => 'cm'],
                            ['size' => 'XL', 'value' => 82.0, 'unit' => 'cm'],
                            ['size' => 'XXL', 'value' => 84.0, 'unit' => 'cm'],
                        ],
                    ],
                ],
            ],
            // Jeans measurements
            [
                'article_type_pattern' => 'Jeans',
                'measurements' => [
                    [
                        'code' => 'WAIST',
                        'measurement' => 'Waist Width',
                        'tol_plus' => 1.0,
                        'tol_minus' => 1.0,
                        'sizes' => [
                            ['size' => '28', 'value' => 71.0, 'unit' => 'cm'],
                            ['size' => '30', 'value' => 76.0, 'unit' => 'cm'],
                            ['size' => '32', 'value' => 81.0, 'unit' => 'cm'],
                            ['size' => '34', 'value' => 86.0, 'unit' => 'cm'],
                            ['size' => '36', 'value' => 91.0, 'unit' => 'cm'],
                        ],
                    ],
                    [
                        'code' => 'INSEAM',
                        'measurement' => 'Inseam Length',
                        'tol_plus' => 1.0,
                        'tol_minus' => 1.0,
                        'sizes' => [
                            ['size' => '28', 'value' => 76.0, 'unit' => 'cm'],
                            ['size' => '30', 'value' => 78.0, 'unit' => 'cm'],
                            ['size' => '32', 'value' => 80.0, 'unit' => 'cm'],
                            ['size' => '34', 'value' => 82.0, 'unit' => 'cm'],
                            ['size' => '36', 'value' => 84.0, 'unit' => 'cm'],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($articles as $article) {
            // Load article type relationship
            $article->load('articleType');
            
            // Find matching measurement template
            $template = null;
            foreach ($measurementTemplates as $tpl) {
                if ($article->articleType && str_contains($article->articleType->name, $tpl['article_type_pattern'])) {
                    $template = $tpl;
                    break;
                }
            }

            // If no template found, create basic measurements
            if (!$template) {
                $template = [
                    'measurements' => [
                        [
                            'code' => 'SIZE',
                            'measurement' => 'Size',
                            'tol_plus' => 1.0,
                            'tol_minus' => 1.0,
                            'sizes' => [
                                ['size' => 'S', 'value' => 1.0, 'unit' => 'cm'],
                                ['size' => 'M', 'value' => 2.0, 'unit' => 'cm'],
                                ['size' => 'L', 'value' => 3.0, 'unit' => 'cm'],
                            ],
                        ],
                    ],
                ];
            }

            // Create measurements for this article
            foreach ($template['measurements'] as $measurementData) {
                $measurement = Measurement::firstOrCreate(
                    [
                        'article_id' => $article->id,
                        'code' => $measurementData['code'],
                    ],
                    [
                        'measurement' => $measurementData['measurement'],
                        'tol_plus' => $measurementData['tol_plus'],
                        'tol_minus' => $measurementData['tol_minus'],
                    ]
                );

                // Create measurement sizes
                foreach ($measurementData['sizes'] as $sizeData) {
                    MeasurementSize::firstOrCreate(
                        [
                            'measurement_id' => $measurement->id,
                            'size' => $sizeData['size'],
                        ],
                        [
                            'value' => $sizeData['value'],
                            'unit' => $sizeData['unit'],
                        ]
                    );
                }
            }
        }
    }
}
