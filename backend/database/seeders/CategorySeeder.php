<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Luxury Watches',
                'description' => 'High-end luxury timepieces from premium brands',
                'is_active' => true,
            ],
            [
                'name' => 'Sports Watches',
                'description' => 'Durable watches designed for active lifestyles and sports activities',
                'is_active' => true,
            ],
            [
                'name' => 'Smartwatches',
                'description' => 'Modern smartwatches with advanced features and connectivity',
                'is_active' => true,
            ],
            [
                'name' => 'Dress Watches',
                'description' => 'Elegant watches perfect for formal occasions',
                'is_active' => true,
            ],
            [
                'name' => 'Casual Watches',
                'description' => 'Versatile watches for everyday wear',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            if (Category::where('name', $category['name'])->exists()) {
                continue;
            }
            Category::create($category);
        }
    }
}
