<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'supplier_id')) {
                $table->foreignId('supplier_id')->nullable()->after('brand_id')->constrained('suppliers')->onDelete('set null');
            }
            // cost_price already exists, skip it
            if (!Schema::hasColumn('products', 'unit')) {
                $table->string('unit', 20)->default('Chiếc')->after('stock_quantity');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['supplier_id', 'cost_price', 'unit']);
        });
    }
};
