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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 15, 0);
            $table->decimal('sale_price', 15, 0)->nullable();
            $table->string('sku')->unique();
            $table->integer('stock_quantity')->default(0);
            $table->json('images')->nullable();
            $table->json('specifications')->nullable();
            $table->string('case_material')->nullable();
            $table->string('strap_material')->nullable();
            $table->string('movement_type')->nullable();
            $table->string('water_resistance')->nullable();
            $table->string('dial_color')->nullable();
            $table->string('case_diameter')->nullable();
            $table->string('gender')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
