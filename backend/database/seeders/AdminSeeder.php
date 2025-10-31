<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $adminEmail = config('admin.email');
        $adminPassword = config('admin.password');
        $adminName = config('admin.name');
        $admin = User::where('email', $adminEmail)->first();
        if (!$admin) {
            DB::table('users')->insert([
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'provider' => 'LOCAL',
                'provider_id' => null,
                'name' => $adminName,
                'phone' => '0000000000',
                'avatar_url' => "https://res.cloudinary.com/dmfyu0ce8/image/upload/v1764759556/istockphoto-1337144146-612x612_uizpnl.jpg",
                'role' => 'ADMIN',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info('Admin account created successfully!');
        } else {
            $this->command->info('Admin account already exists.');
            if (!Hash::check($adminPassword, $admin->password)) {
                $admin->password = Hash::make($adminPassword);
                $admin->role = 'ADMIN';
                $admin->save();
                $this->command->info('Admin password updated!');
            }
        }
    }
}
