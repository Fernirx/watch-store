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
        Schema::table('products', function (Blueprint $table) {
            // Thay đổi precision của price và sale_price để phù hợp với VND
            // decimal(15, 0) có thể lưu giá lên đến 999,999,999,999,999 VND
            $table->decimal('price', 15, 0)->change();
            $table->decimal('sale_price', 15, 0)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->change();
            $table->decimal('sale_price', 10, 2)->nullable()->change();
        });
    }
};
