<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleType;
use App\Models\Brand;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure ArticleTypeSeeder has run
        $this->call(ArticleTypeSeeder::class);

        $articleTypes = ArticleType::all()->keyBy('name');
        $brands = Brand::all();

        if ($brands->isEmpty()) {
            $this->command->warn('No brands found. Please run BrandSeeder first.');
            return;
        }

        $articles = [
            // Nike Articles
            [
                'brand' => 'Nike',
                'article_type' => 'T-Shirt',
                'article_style' => 'NKE-TS-001',
                'description' => 'Classic cotton t-shirt with logo',
            ],
            [
                'brand' => 'Nike',
                'article_type' => 'T-Shirt',
                'article_style' => 'NKE-TS-002',
                'description' => 'Performance dry-fit t-shirt',
            ],
            [
                'brand' => 'Nike',
                'article_type' => 'Polo Shirt',
                'article_style' => 'NKE-PS-001',
                'description' => 'Premium polo with embroidered logo',
            ],
            [
                'brand' => 'Nike',
                'article_type' => 'Trouser',
                'article_style' => 'NKE-TR-001',
                'description' => 'Athletic training trousers',
            ],
            [
                'brand' => 'Nike',
                'article_type' => 'Jacket',
                'article_style' => 'NKE-JK-001',
                'description' => 'Windbreaker jacket',
            ],

            // Adidas Articles
            [
                'brand' => 'Adidas',
                'article_type' => 'T-Shirt',
                'article_style' => 'ADD-TS-001',
                'description' => 'Three stripes classic t-shirt',
            ],
            [
                'brand' => 'Adidas',
                'article_type' => 'T-Shirt',
                'article_style' => 'ADD-TS-002',
                'description' => 'ClimaLite performance t-shirt',
            ],
            [
                'brand' => 'Adidas',
                'article_type' => 'Polo Shirt',
                'article_style' => 'ADD-PS-001',
                'description' => 'Classic polo with trefoil logo',
            ],
            [
                'brand' => 'Adidas',
                'article_type' => 'Shirt',
                'article_style' => 'ADD-SH-001',
                'description' => 'Long sleeve button-down shirt',
            ],
            [
                'brand' => 'Adidas',
                'article_type' => 'Jeans',
                'article_style' => 'ADD-JN-001',
                'description' => 'Slim fit denim jeans',
            ],

            // Puma Articles
            [
                'brand' => 'Puma',
                'article_type' => 'T-Shirt',
                'article_style' => 'PUM-TS-001',
                'description' => 'Puma logo t-shirt',
            ],
            [
                'brand' => 'Puma',
                'article_type' => 'Polo Shirt',
                'article_style' => 'PUM-PS-001',
                'description' => 'Classic fit polo shirt',
            ],
            [
                'brand' => 'Puma',
                'article_type' => 'Trouser',
                'article_style' => 'PUM-TR-001',
                'description' => 'Training pants',
            ],
            [
                'brand' => 'Puma',
                'article_type' => 'Jacket',
                'article_style' => 'PUM-JK-001',
                'description' => 'Track jacket',
            ],

            // Under Armour Articles
            [
                'brand' => 'Under Armour',
                'article_type' => 'T-Shirt',
                'article_style' => 'UAR-TS-001',
                'description' => 'HeatGear compression t-shirt',
            ],
            [
                'brand' => 'Under Armour',
                'article_type' => 'Polo Shirt',
                'article_style' => 'UAR-PS-001',
                'description' => 'Performance polo',
            ],
            [
                'brand' => 'Under Armour',
                'article_type' => 'Trouser',
                'article_style' => 'UAR-TR-001',
                'description' => 'Training pants',
            ],

            // Reebok Articles
            [
                'brand' => 'Reebok',
                'article_type' => 'T-Shirt',
                'article_style' => 'REB-TS-001',
                'description' => 'Classic logo t-shirt',
            ],
            [
                'brand' => 'Reebok',
                'article_type' => 'Polo Shirt',
                'article_style' => 'REB-PS-001',
                'description' => 'Vector logo polo',
            ],
            [
                'brand' => 'Reebok',
                'article_type' => 'Trouser',
                'article_style' => 'REB-TR-001',
                'description' => 'Athletic trousers',
            ],

            // New Balance Articles
            [
                'brand' => 'New Balance',
                'article_type' => 'T-Shirt',
                'article_style' => 'NBL-TS-001',
                'description' => 'NB logo t-shirt',
            ],
            [
                'brand' => 'New Balance',
                'article_type' => 'Polo Shirt',
                'article_style' => 'NBL-PS-001',
                'description' => 'Performance polo',
            ],

            // Champion Articles
            [
                'brand' => 'Champion',
                'article_type' => 'T-Shirt',
                'article_style' => 'CHP-TS-001',
                'description' => 'Reverse Weave t-shirt',
            ],
            [
                'brand' => 'Champion',
                'article_type' => 'Hoodie',
                'article_style' => 'CHP-HD-001',
                'description' => 'Classic hoodie',
            ],

            // Fila Articles
            [
                'brand' => 'Fila',
                'article_type' => 'T-Shirt',
                'article_style' => 'FIL-TS-001',
                'description' => 'Heritage logo t-shirt',
            ],
            [
                'brand' => 'Fila',
                'article_type' => 'Polo Shirt',
                'article_style' => 'FIL-PS-001',
                'description' => 'Classic polo',
            ],
        ];

        foreach ($articles as $articleData) {
            $brand = $brands->firstWhere('name', $articleData['brand']);
            $articleType = $articleTypes->get($articleData['article_type']);

            if (!$brand || !$articleType) {
                continue;
            }

            Article::firstOrCreate(
                [
                    'brand_id' => $brand->id,
                    'article_style' => $articleData['article_style'],
                ],
                [
                    'article_type_id' => $articleType->id,
                    'description' => $articleData['description'],
                ]
            );
        }
    }
}
