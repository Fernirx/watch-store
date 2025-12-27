<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();

            // Basic Info
            $table->string('code', 50)->unique(); // Mã coupon (VD: SUMMER2024)
            $table->text('description')->nullable(); // Mô tả coupon

            // Discount Configuration
            $table->enum('discount_type', ['PERCENTAGE', 'FIXED'])->default('PERCENTAGE');
            $table->decimal('discount_value', 15, 2); // % (0-100) hoặc số tiền cố định
            $table->decimal('max_discount', 15, 2)->nullable(); // Giảm tối đa (cho PERCENTAGE)
            $table->decimal('min_order_value', 15, 2)->default(0); // Đơn hàng tối thiểu

            // Usage Limits
            $table->enum('usage_type', ['SINGLE_USE', 'LIMITED_USE']); // Loại sử dụng
            $table->integer('usage_limit')->nullable(); // Giới hạn sử dụng (cho LIMITED_USE)
            $table->integer('usage_count')->default(0); // Số lần đã sử dụng

            // Validity Period
            $table->timestamp('valid_from')->nullable(); // Ngày bắt đầu
            $table->timestamp('valid_until')->nullable(); // Ngày kết thúc

            // Status
            $table->boolean('is_active')->default(true); // Trạng thái hoạt động

            $table->timestamps();

            // Indexes for performance
            $table->index('code'); // Tìm kiếm theo mã
            $table->index('is_active'); // Lọc active coupons
            $table->index(['valid_from', 'valid_until']); // Tìm coupon còn hạn
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
