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
            $table->string('customer_name')->nullable(); // Tên khách hàng (guest hoặc user)
            $table->string('customer_email'); // Email (bắt buộc)
            $table->string('order_number')->unique();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('total', 15, 2);
            $table->enum('status', ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED'])->default('PENDING');
            $table->string('payment_method')->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending');
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->text('shipping_address')->nullable();
            $table->string('shipping_phone')->nullable();
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
