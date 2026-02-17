<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Seed article types
        $this->call([
            ArticleTypeSeeder::class,
            BrandSeeder::class,
            ArticleSeeder::class,
            MeasurementSeeder::class,
            PurchaseOrderSeeder::class,
        ]);

        // Uncomment to create additional test users
        // User::factory(10)->create();
    }
}
