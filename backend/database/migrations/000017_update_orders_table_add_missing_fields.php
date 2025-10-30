<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Add missing fields
            if (!Schema::hasColumn('orders', 'shipping_fee')) {
                $table->decimal('shipping_fee', 15, 2)->default(0)->after('subtotal');
            }

            if (!Schema::hasColumn('orders', 'payment_method')) {
                $table->string('payment_method')->nullable()->after('status');
            }

            if (!Schema::hasColumn('orders', 'payment_status')) {
                $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending')->after('payment_method');
            }

            if (!Schema::hasColumn('orders', 'shipping_address')) {
                $table->text('shipping_address')->nullable()->after('payment_status');
            }

            if (!Schema::hasColumn('orders', 'shipping_phone')) {
                $table->string('shipping_phone')->nullable()->after('shipping_address');
            }

            if (!Schema::hasColumn('orders', 'notes')) {
                $table->text('notes')->nullable()->after('shipping_phone');
            }

            // Drop unnecessary columns if they exist
            if (Schema::hasColumn('orders', 'customer_name')) {
                $table->dropColumn('customer_name');
            }

            if (Schema::hasColumn('orders', 'customer_email')) {
                $table->dropColumn('customer_email');
            }

            if (Schema::hasColumn('orders', 'customer_phone')) {
                $table->dropColumn('customer_phone');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Restore old columns
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();

            // Drop new columns
            $table->dropColumn([
                'shipping_fee',
                'payment_method',
                'payment_status',
                'shipping_address',
                'shipping_phone',
                'notes',
            ]);
        });
    }
};
