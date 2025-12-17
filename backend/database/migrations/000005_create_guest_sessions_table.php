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
        Schema::create('guest_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('guest_token', 64)->unique();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('last_active')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('expires_at');

            $table->index('expires_at', 'idx_guest_sessions_expires');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guest_sessions');
    }
};
