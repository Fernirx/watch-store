<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            [
                'name' => 'Rolex',
                'description' => 'Swiss luxury watchmaker known for precision and prestige',
                'country' => 'Switzerland',
                'website' => 'https://www.rolex.com',
                'logo_url' => 'https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761139/1200px-Logo_da_Rolex_ycnri3.png',
                'is_active' => true,
            ],
            [
                'name' => 'Omega',
                'description' => 'Swiss luxury watchmaker with a rich heritage in precision timekeeping',
                'country' => 'Switzerland',
                'website' => 'https://www.omegawatches.com',
                'logo_url' => 'https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761180/2560px-Omega_Logo.svg_twqdfw.png',
                'is_active' => true,
            ],
            [
                'name' => 'Seiko',
                'description' => 'Japanese watchmaker renowned for innovation and quality',
                'country' => 'Japan',
                'website' => 'https://www.seiko.com',
                'logo_url' => 'https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764761202/2560px-Seiko_logo.svg_sge5wd.png',
                'is_active' => true,
            ],
            [
                'name' => 'Casio',
                'description' => 'Japanese electronics company famous for G-Shock watches',
                'country' => 'Japan',
                'website' => 'https://www.casio.com',
                'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Casio_logo.svg/1024px-Casio_logo.svg.png',
                'is_active' => true,
            ],
            [
                'name' => 'Apple',
                'description' => 'Technology company producing the Apple Watch smartwatch',
                'country' => 'United States',
                'website' => 'https://www.apple.com',
                'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
                'is_active' => true,
            ],
            [
                'name' => 'Tag Heuer',
                'description' => 'Swiss luxury watchmaker specializing in sports watches',
                'country' => 'Switzerland',
                'website' => 'https://www.tagheuer.com',
                'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/TAG_Heuer_logo.svg/2361px-TAG_Heuer_logo.svg.png',
                'is_active' => true,
            ],
            [
                'name' => 'Citizen',
                'description' => 'Japanese watchmaker known for Eco-Drive technology',
                'country' => 'Japan',
                'website' => 'https://www.citizenwatch.com',
                'logo_url' => 'https://cdn.worldvectorlogo.com/logos/citizen-watch-logo.svg',
                'is_active' => true,
            ],
            [
                'name' => 'Tissot',
                'description' => 'Swiss watchmaker offering quality timepieces at accessible prices',
                'country' => 'Switzerland',
                'website' => 'https://www.tissotwatches.com',
                'logo_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Tissot_Logo.svg/2560px-Tissot_Logo.svg.png',
                'is_active' => true,
            ],
        ];

        foreach ($brands as $brand) {
            if (Brand::where('name', $brand['name'])->exists()) {
                continue;
            }
            Brand::create($brand);
        }
    }
}
