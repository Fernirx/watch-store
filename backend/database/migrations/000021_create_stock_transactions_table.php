<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['IMPORT', 'EXPORT']);
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->integer('quantity'); // Positive for IMPORT, negative for EXPORT
            $table->decimal('unit_price', 15, 2)->nullable(); // For imports
            $table->string('reference_type')->nullable(); // ORDER, MANUAL, ADJUSTMENT, etc.
            $table->unsignedBigInteger('reference_id')->nullable(); // order_id if from order
            $table->foreignId('performed_by')->constrained('users')->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->timestamp('transaction_date');
            $table->timestamps();

            $table->index(['product_id', 'type']);
            $table->index('transaction_date');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
    }
};
