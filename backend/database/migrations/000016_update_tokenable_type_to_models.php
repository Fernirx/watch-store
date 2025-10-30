<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update personal_access_tokens table
        DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\\User')
            ->update(['tokenable_type' => 'App\\Models\\User']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback if needed
        DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\\Models\\User')
            ->update(['tokenable_type' => 'App\\User']);
    }
};
