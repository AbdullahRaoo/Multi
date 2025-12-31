<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleType;
use App\Models\Brand;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderArticle;
use App\Models\PurchaseOrderClientReference;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PurchaseOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = Brand::all();
        $articleTypes = ArticleType::all()->keyBy('name');

        if ($brands->isEmpty()) {
            $this->command->warn('No brands found. Please run BrandSeeder first.');
            return;
        }

        $statuses = ['Active', 'Pending', 'Completed'];
        $countries = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Italy', 'Spain', 'Australia', 'Japan', 'China'];
        
        $poCounter = 1;

        // Create multiple purchase orders for each brand
        foreach ($brands as $brand) {
            $articles = Article::where('brand_id', $brand->id)->get();

            if ($articles->isEmpty()) {
                continue;
            }

            // Create 3-5 purchase orders per brand
            $poCount = rand(3, 5);
            
            for ($i = 0; $i < $poCount; $i++) {
                $poNumber = 'PO-' . str_pad($poCounter++, 6, '0', STR_PAD_LEFT);
                $date = Carbon::now()->subDays(rand(0, 90));
                $status = $statuses[array_rand($statuses)];
                $country = $countries[array_rand($countries)];

                $purchaseOrder = PurchaseOrder::create([
                    'po_number' => $poNumber,
                    'date' => $date,
                    'brand_id' => $brand->id,
                    'country' => $country,
                    'status' => $status,
                ]);

                // Create 2-4 articles per purchase order
                $articleCount = rand(2, 4);
                $selectedArticles = $articles->random(min($articleCount, $articles->count()));

                foreach ($selectedArticles as $article) {
                    PurchaseOrderArticle::create([
                        'purchase_order_id' => $purchaseOrder->id,
                        'article_type_id' => $article->article_type_id,
                        'article_style' => $article->article_style,
                        'article_description' => $article->description,
                        'article_color' => $this->getRandomColor(),
                        'order_quantity' => rand(50, 500),
                    ]);
                }

                // Create 1-3 client references per purchase order
                $referenceCount = rand(1, 3);
                
                for ($j = 0; $j < $referenceCount; $j++) {
                    PurchaseOrderClientReference::create([
                        'purchase_order_id' => $purchaseOrder->id,
                        'reference_name' => $this->getRandomName(),
                        'reference_number' => 'REF-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                        'reference_email_address' => strtolower($this->getRandomName()) . '@example.com',
                        'email_subject' => $this->getRandomSubject(),
                        'email_date' => $date->copy()->subDays(rand(1, 10)),
                    ]);
                }
            }
        }
    }

    private function getRandomColor(): string
    {
        $colors = [
            'Black', 'White', 'Navy Blue', 'Gray', 'Red', 'Blue', 'Green',
            'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Beige', 'Khaki',
        ];
        return $colors[array_rand($colors)];
    }

    private function getRandomName(): string
    {
        $firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        
        return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
    }

    private function getRandomSubject(): string
    {
        $subjects = [
            'Purchase Order Confirmation',
            'Order Inquiry',
            'Product Specifications',
            'Delivery Schedule',
            'Quality Requirements',
            'Shipping Instructions',
            'Payment Terms',
            'Order Amendment',
        ];
        return $subjects[array_rand($subjects)];
    }
}
