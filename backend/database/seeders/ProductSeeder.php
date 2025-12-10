<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'category_id' => 1,
                'brand_id' => 1,
                'name' => 'Rolex Submariner Date',
                'description' => 'Iconic dive watch with date display and Cerachrom bezel',
                'price' => 1500000.00,
                'sale_price' => null,
                'sku' => 'ROLEX-SUB-001',
                'stock_quantity' => 5,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Stainless Steel',
                'strap_material' => 'Stainless Steel',
                'movement_type' => 'Automatic',
                'water_resistance' => '300m',
                'dial_color' => 'Black',
                'case_diameter' => '41mm',
                'gender' => 'male',
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 1,
                'brand_id' => 1,
                'name' => 'Rolex Datejust 36',
                'description' => 'Classic dress watch with date function and fluted bezel',
                'price' => 1280000.00,
                'sale_price' => null,
                'sku' => 'ROLEX-DJ-001',
                'stock_quantity' => 8,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Steel and Gold',
                'strap_material' => 'Jubilee Bracelet',
                'movement_type' => 'Automatic',
                'water_resistance' => '100m',
                'dial_color' => 'Champagne',
                'case_diameter' => '36mm',
                'gender' => 'unisex',
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 1,
                'brand_id' => 2,
                'name' => 'Omega Speedmaster Professional',
                'description' => 'Legendary moonwatch with chronograph function',
                'price' => 6800000.00,
                'sale_price' => 6500000.00,
                'sku' => 'OMEGA-SPEED-001',
                'stock_quantity' => 12,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Stainless Steel',
                'strap_material' => 'Stainless Steel',
                'movement_type' => 'Manual',
                'water_resistance' => '50m',
                'dial_color' => 'Black',
                'case_diameter' => '42mm',
                'gender' => 'male',
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 2,
                'brand_id' => 3,
                'name' => 'Seiko Prospex Diver',
                'description' => 'Professional dive watch with automatic movement',
                'price' => 850000.00,
                'sale_price' => 799000.00,
                'sku' => 'SEIKO-PRO-001',
                'stock_quantity' => 20,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Stainless Steel',
                'strap_material' => 'Rubber',
                'movement_type' => 'Automatic',
                'water_resistance' => '200m',
                'dial_color' => 'Blue',
                'case_diameter' => '45mm',
                'gender' => 'male',
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'category_id' => 2,
                'brand_id' => 4,
                'name' => 'Casio G-Shock GA-2100',
                'description' => 'Tough digital-analog watch with carbon core guard',
                'price' => 1200000.00,
                'sale_price' => 990000.00,
                'sku' => 'CASIO-GA-001',
                'stock_quantity' => 50,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Resin',
                'strap_material' => 'Resin',
                'movement_type' => 'Quartz',
                'water_resistance' => '200m',
                'dial_color' => 'Black',
                'case_diameter' => '48mm',
                'gender' => 'unisex',
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 3,
                'brand_id' => 5,
                'name' => 'Apple Watch Series 9 GPS',
                'description' => 'Advanced smartwatch with health monitoring and fitness tracking',
                'price' => 4290000.00,
                'sale_price' => 399000.00,
                'sku' => 'APPLE-S9-001',
                'stock_quantity' => 30,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Aluminum',
                'strap_material' => 'Sport Band',
                'movement_type' => 'Digital',
                'water_resistance' => '50m',
                'dial_color' => 'Midnight',
                'case_diameter' => '45mm',
                'gender' => 'unisex',
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 2,
                'brand_id' => 6,
                'name' => 'Tag Heuer Carrera Chronograph',
                'description' => 'Racing-inspired chronograph with sporty design',
                'price' => 5200000.00,
                'sale_price' => null,
                'sku' => 'TAG-CAR-001',
                'stock_quantity' => 7,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Stainless Steel',
                'strap_material' => 'Leather',
                'movement_type' => 'Automatic',
                'water_resistance' => '100m',
                'dial_color' => 'Silver',
                'case_diameter' => '43mm',
                'gender' => 'male',
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'category_id' => 5,
                'brand_id' => 7,
                'name' => 'Citizen Eco-Drive Classic',
                'description' => 'Solar-powered watch with classic design',
                'price' => 29000005.00,
                'sale_price' => 2490000.00,
                'sku' => 'CITIZEN-ECO-001',
                'stock_quantity' => 25,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Stainless Steel',
                'strap_material' => 'Leather',
                'movement_type' => 'Eco-Drive',
                'water_resistance' => '100m',
                'dial_color' => 'White',
                'case_diameter' => '40mm',
                'gender' => 'male',
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'category_id' => 4,
                'brand_id' => 8,
                'name' => 'Tissot PRX Powermatic 80',
                'description' => 'Elegant dress watch with integrated bracelet',
                'price' => 7200000.00,
                'sale_price' => 699000.00,
                'sku' => 'TISSOT-PRX-001',
                'stock_quantity' => 15,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Stainless Steel',
                'strap_material' => 'Stainless Steel',
                'movement_type' => 'Automatic',
                'water_resistance' => '100m',
                'dial_color' => 'Blue',
                'case_diameter' => '40mm',
                'gender' => 'unisex',
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 4,
                'brand_id' => 3,
                'name' => 'Seiko Presage Cocktail Time',
                'description' => 'Japanese craftsmanship with elegant sunburst dial',
                'price' => 49500000.00,
                'sale_price' => null,
                'sku' => 'SEIKO-PRES-001',
                'stock_quantity' => 18,
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761580/watches_plug_opt-350x350_hr80tv.png",
                        "public_id" => "watches_plug_opt-350x350_hr80tv"
                    ]
                ],
                'case_material' => 'Stainless Steel',
                'strap_material' => 'Leather',
                'movement_type' => 'Automatic',
                'water_resistance' => '50m',
                'dial_color' => 'Cocktail Blue',
                'case_diameter' => '40.5mm',
                'gender' => 'unisex',
                'is_featured' => false,
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            if (Product::where('sku', $product['sku'])->exists()) {
                continue;
            }
            if (Product::where('name', $product['name'])->exists()) {
                continue;
            }
            Product::create($product);
        }
    }
}
