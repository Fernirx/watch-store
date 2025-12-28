<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade')->comment('Liên kết với bảng users');
            $table->string('name', 100)->comment('Tên khách hàng');
            $table->string('shipping_name', 200)->nullable()->comment('Tên người nhận hàng');
            $table->string('shipping_phone', 15)->nullable()->comment('SĐT nhận hàng');
            $table->text('shipping_address')->nullable()->comment('Địa chỉ giao hàng đầy đủ');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
