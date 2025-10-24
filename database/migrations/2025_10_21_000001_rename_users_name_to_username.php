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
        // Note: Renaming columns may require the doctrine/dbal package when altering existing columns.
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'name') && !Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('name', 'username');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'username') && !Schema::hasColumn('users', 'name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('username', 'name');
            });
        }
    }
};
