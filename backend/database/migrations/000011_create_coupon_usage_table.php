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
        Schema::create('coupon_usage', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('coupon_id')->constrained('coupons')->onDelete('cascade');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');

            // User tracking (nullable for guests)
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('guest_token', 64)->nullable();

            // Email & Phone tracking (critical for preventing reuse)
            $table->string('email'); // Email người dùng
            $table->string('phone'); // Số điện thoại người dùng

            // Discount information
            $table->decimal('discount_amount', 15, 2); // Số tiền đã giảm
            $table->timestamp('used_at'); // Thời điểm sử dụng

            $table->timestamps();

            // Indexes for performance
            $table->index(['coupon_id', 'email']); // Check email đã dùng coupon chưa
            $table->index(['coupon_id', 'phone']); // Check phone đã dùng coupon chưa
            $table->index(['coupon_id', 'email', 'phone']); // Check combo email+phone
            $table->index('order_id'); // Tìm usage theo order
            $table->index('user_id'); // Tìm usage theo user

            // Unique constraint: One coupon usage per order
            $table->unique(['coupon_id', 'order_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_usage');
    }
};
