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
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('order_number')->unique();

            // Totals
            $table->decimal('subtotal', 15, 2);
            $table->decimal('total', 15, 2);

            // Status
            $table->enum('status', ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED'])->default('PENDING');

            // Customer info
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('order_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
