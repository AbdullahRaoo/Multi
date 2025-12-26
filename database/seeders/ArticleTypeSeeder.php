<?php

namespace Database\Seeders;

use App\Models\ArticleType;
use Illuminate\Database\Seeder;

class ArticleTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $articleTypes = [
            'T-Shirt',
            'Polo Shirt',
            'Shirt',
            'Trouser',
            'Jeans',
            'Jacket',
            'Dress',
            'Skirt',
        ];

        foreach ($articleTypes as $type) {
            ArticleType::firstOrCreate(['name' => $type]);
        }
    }
}
