<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('guest_token', 64)->nullable();
            $table->foreign('guest_token')->references('guest_token')->on('guest_sessions')->onDelete('set null');
            $table->string('customer_name'); // Tên khách hàng (bắt buộc)
            $table->string('customer_email'); // Email (bắt buộc)
            $table->string('order_number')->unique();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('total', 15, 2);
            $table->enum('status', ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])->default('PENDING');
            $table->enum('payment_method', ['cod', 'vnpay'])->default('cod');
            $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending');
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->text('shipping_address'); // Địa chỉ giao hàng (bắt buộc)
            $table->string('shipping_phone'); // Số điện thoại giao hàng (bắt buộc)
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->onDelete('set null');
            $table->string('coupon_code', 50)->nullable();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index('guest_token');
            $table->index('order_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
