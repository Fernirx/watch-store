<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otps', function (Blueprint $table) {
            $table->id();

            // Email cần xác thực
            $table->string('email')->index()->comment('Email nhận OTP');

            // OTP code (6 chữ số)
            $table->string('otp', 6)->comment('Mã OTP');

            // Loại OTP
            $table->enum('type', ['REGISTER', 'FORGOT_PASSWORD', 'GUEST_CHECKOUT'])
                  ->default('REGISTER')
                  ->comment('Loại OTP');

            // Trạng thái
            $table->boolean('is_used')->default(false)->comment('OTP đã sử dụng chưa');
            $table->timestamp('expires_at')->comment('Thời gian hết hạn');
            $table->timestamp('verified_at')->nullable()->comment('Thời gian verify thành công');

            // Guest token (cho checkout)
            $table->string('guest_token')->nullable()->comment('Guest token để link với cart/order');

            // Rate limiting
            $table->integer('attempt_count')->default(0)->comment('Số lần nhập sai');
            $table->integer('max_attempts')->default(5)->comment('Giới hạn số lần nhập');

            $table->timestamps();

            // Indexes
            $table->index(['email', 'type', 'is_used']);
            $table->index(['guest_token', 'verified_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otps');
    }
};
