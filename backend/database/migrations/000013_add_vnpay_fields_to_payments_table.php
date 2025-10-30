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
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'payment_method')) {
                $table->string('payment_method')->after('order_id')->default('vnpay');
            }

            if (!Schema::hasColumn('payments', 'response_code')) {
                $table->string('response_code')->nullable()->after('transaction_id');
            }

            if (!Schema::hasColumn('payments', 'response_message')) {
                $table->text('response_message')->nullable()->after('response_code');
            }

            // Cập nhật enum status nếu cần (thêm 'pending', 'completed', 'failed')
            // MySQL không hỗ trợ ALTER ENUM trực tiếp, nên bỏ qua hoặc drop/recreate
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'response_code', 'response_message']);
        });
    }
};
