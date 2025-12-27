<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade')->comment('Sản phẩm được đánh giá');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade')->comment('Đơn hàng đã mua');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade')->comment('Người dùng đánh giá (nếu đã đăng nhập)');

            // Guest Information
            $table->string('guest_email')->nullable()->comment('Email khách (nếu guest) - dùng để xác thực');
            $table->string('guest_name')->nullable()->comment('Tên khách (nếu guest)');

            // Review Content
            $table->unsignedTinyInteger('rating')->comment('Đánh giá sao (1-5)');
            $table->text('comment')->nullable()->comment('Nội dung đánh giá');

            // Verification
            $table->boolean('is_verified_purchase')->default(true)->comment('Đã mua hàng xác thực');

            $table->timestamps();

            // Indexes
            $table->index('product_id');
            $table->index('user_id');
            $table->index('rating');
            $table->index('created_at');
            $table->index('guest_email');

            // Unique constraints để ngăn duplicate review
            // User đã đăng nhập: 1 user chỉ review 1 product 1 lần
            $table->unique(['product_id', 'user_id'], 'unique_user_review');
            // Guest: 1 email chỉ review 1 product 1 lần
            $table->unique(['product_id', 'guest_email'], 'unique_guest_review');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
