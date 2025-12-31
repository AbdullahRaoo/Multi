<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            [
                'name' => 'Nike',
                'description' => 'Just Do It - Premium athletic wear and sportswear brand',
            ],
            [
                'name' => 'Adidas',
                'description' => 'Impossible is Nothing - Global sportswear manufacturer',
            ],
            [
                'name' => 'Puma',
                'description' => 'Forever Faster - Performance and lifestyle brand',
            ],
            [
                'name' => 'Under Armour',
                'description' => 'I Will - Athletic performance apparel and footwear',
            ],
            [
                'name' => 'Reebok',
                'description' => 'Be More Human - Fitness and training brand',
            ],
            [
                'name' => 'New Balance',
                'description' => 'Always in Beta - Athletic footwear and apparel',
            ],
            [
                'name' => 'Champion',
                'description' => 'Be Your Own Champion - Athletic and casual wear',
            ],
            [
                'name' => 'Fila',
                'description' => 'Sport Style - Italian sportswear brand',
            ],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(
                ['name' => $brand['name']],
                $brand
            );
        }
    }
}
