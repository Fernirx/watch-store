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
                'code' => 'ROLEX-SUB-001',
                'name' => 'Rolex Submariner Date',
                'description' => 'Iconic dive watch with date display and Cerachrom bezel',
                'price' => 15000000.00,
                'original_price' => 17000000.00,
                'cost_price' => 12000000.00,
                'stock_quantity' => 5,
                'min_stock_level' => 3,
                'reorder_point' => 2,
                'warranty_period' => '24 tháng',
                'origin_country' => 'Thụy Sỹ',
                'gender' => 'Nam',
                'movement_type' => 'Automatic',
                'movement_name' => 'Calibre 3235',
                'power_reserve' => '70 giờ',
                'case_material' => 'Thép không gỉ 904L',
                'strap_material' => 'Thép không gỉ 904L',
                'glass_material' => 'Sapphire chống trầy',
                'dial_color' => 'Đen',
                'case_color' => 'Bạc',
                'strap_color' => 'Bạc',
                'water_resistance' => '300m (30 ATM)',
                'case_size' => 41.00,
                'case_thickness' => 12.50,
                'weight' => 155.00,
                'features' => ['Date Display', 'Unidirectional Rotating Bezel', 'Luminous Hands'],
                'images' => [
                    [
                        "url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1766192368/watch-store/products/d9scdynczgu46ub4dtep.jpg",
                        "public_id" => "d9scdynczgu46ub4dtep",
                        "is_primary" => true
                    ]
                ],
                'is_new' => false,
                'is_on_sale' => true,
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 2,
                'brand_id' => 3,
                'code' => 'SEIKO-PRO-001',
                'name' => 'Seiko Prospex Diver',
                'description' => 'Đồng hồ lặn chuyên nghiệp với bộ máy tự động, chống nước 200m',
                'price' => 8500000.00,
                'original_price' => 9500000.00,
                'stock_quantity' => 20,
                'min_stock_level' => 5,
                'warranty_period' => '12 tháng',
                'origin_country' => 'Nhật Bản',
                'gender' => 'Nam',
                'movement_type' => 'Automatic',
                'movement_name' => 'Calibre 6R35',
                'power_reserve' => '70 giờ',
                'case_material' => 'Thép không gỉ',
                'strap_material' => 'Cao su',
                'glass_material' => 'Hardlex',
                'dial_color' => 'Xanh dương',
                'case_color' => 'Bạc',
                'strap_color' => 'Đen',
                'water_resistance' => '200m (20 ATM)',
                'case_size' => 45.00,
                'case_thickness' => 13.20,
                'weight' => 180.00,
                'features' => ['Date Display', 'Rotating Bezel', 'Luminous Dial', 'Screw-Down Crown'],
                'images' => [
                    ["url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1766192368/watch-store/products/d9scdynczgu46ub4dtep.jpg", "public_id" => "d9scdynczgu46ub4dtep", "is_primary" => true]
                ],
                'is_new' => false,
                'is_on_sale' => true,
                'is_featured' => false,
                'is_active' => true,
            ],
            [
                'category_id' => 2,
                'brand_id' => 4,
                'code' => 'CASIO-GA-001',
                'name' => 'Casio G-Shock GA-2100',
                'description' => 'Đồng hồ thể thao bền bỉ với Carbon Core Guard, chống sốc',
                'price' => 3200000.00,
                'stock_quantity' => 50,
                'min_stock_level' => 10,
                'warranty_period' => '12 tháng',
                'origin_country' => 'Nhật Bản',
                'gender' => 'Unisex',
                'movement_type' => 'Quartz',
                'battery_type' => 'SR927W',
                'battery_voltage' => '3V',
                'case_material' => 'Nhựa Resin',
                'strap_material' => 'Nhựa Resin',
                'glass_material' => 'Mineral',
                'dial_color' => 'Đen',
                'case_color' => 'Đen',
                'strap_color' => 'Đen',
                'water_resistance' => '200m (20 ATM)',
                'case_size' => 48.50,
                'case_thickness' => 11.80,
                'weight' => 51.00,
                'features' => ['Shock Resistant', 'World Time', 'LED Light', 'Stopwatch'],
                'images' => [
                    ["url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1766192368/watch-store/products/d9scdynczgu46ub4dtep.jpg", "public_id" => "d9scdynczgu46ub4dtep", "is_primary" => true]
                ],
                'is_new' => true,
                'is_on_sale' => false,
                'is_featured' => true,
                'is_active' => true,
            ],
            [
                'category_id' => 5,
                'brand_id' => 7,
                'code' => 'CITIZEN-ECO-001',
                'name' => 'Citizen Eco-Drive Classic',
                'description' => 'Đồng hồ năng lượng mặt trời, không cần thay pin, thiết kế cổ điển thanh lịch',
                'price' => 5900000.00,
                'original_price' => 6900000.00,
                'stock_quantity' => 25,
                'min_stock_level' => 8,
                'warranty_period' => '24 tháng',
                'origin_country' => 'Nhật Bản',
                'gender' => 'Nam',
                'movement_type' => 'Solar',
                'movement_name' => 'Eco-Drive E111',
                'case_material' => 'Thép không gỉ',
                'strap_material' => 'Da thật',
                'glass_material' => 'Sapphire',
                'dial_color' => 'Trắng',
                'case_color' => 'Bạc',
                'strap_color' => 'Nâu',
                'water_resistance' => '100m (10 ATM)',
                'case_size' => 40.00,
                'case_thickness' => 10.00,
                'weight' => 120.00,
                'features' => ['Solar Powered', 'Date Display', 'Water Resistant'],
                'images' => [
                    ["url" => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1766192368/watch-store/products/d9scdynczgu46ub4dtep.jpg", "public_id" => "d9scdynczgu46ub4dtep", "is_primary" => true]
                ],
                'is_new' => false,
                'is_on_sale' => true,
                'is_featured' => false,
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            if (Product::where('code', $product['code'])->exists()) {
                continue;
            }
            if (Product::where('name', $product['name'])->exists()) {
                continue;
            }
            Product::create($product);
        }
    }
}
