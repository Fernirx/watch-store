<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('guest_token', 64)->nullable()->unique();
            $table->foreign('guest_token')->references('guest_token')->on('guest_sessions')->onDelete('cascade');
            $table->timestamps();

            $table->index('user_id');
            $table->index('guest_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
