<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Authentication
            $table->string('email', 100)->unique();
            $table->string('password')->nullable(); // NULL for Google OAuth
            $table->enum('provider', ['LOCAL', 'GOOGLE'])->default('LOCAL');
            $table->string('provider_id')->nullable(); // Google ID

            // Profile
            $table->string('name', 100);
            $table->string('phone', 15)->nullable();
            $table->string('avatar_url')->nullable();

            // Role & Status
            $table->enum('role', ['USER', 'ADMIN'])->default('USER');
            $table->boolean('is_active')->default(true);

            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();

            $table->index(['provider', 'provider_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
