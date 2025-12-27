<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Đảm bảo một user không thể thêm cùng một sản phẩm vào yêu thích nhiều lần
            $table->unique(['user_id', 'product_id']);

            // Index để tìm kiếm nhanh
            $table->index('user_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
