<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email', 100)->unique()->comment('Email đăng nhập');
            $table->string('password')->nullable()->comment('Mật khẩu (null nếu đăng nhập qua Google)');
            $table->enum('provider', ['LOCAL', 'GOOGLE'])->default('LOCAL')->comment('Phương thức đăng nhập');
            $table->string('provider_id')->nullable()->comment('ID từ provider (Google ID)');
            $table->string('avatar_url')->nullable()->comment('URL avatar');
            $table->enum('role', ['USER', 'ADMIN'])->default('USER')->comment('Vai trò');
            $table->boolean('is_active')->default(true)->comment('Trạng thái active');
            $table->timestamp('email_verified_at')->nullable()->comment('Thời điểm verify email');
            $table->timestamps();
            $table->index(['provider', 'provider_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
