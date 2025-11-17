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
        Schema::table('subtasks', function (Blueprint $table) {
            // Add task_item_id column (nullable initially to allow existing records)
            $table->foreignId('task_item_id')->nullable()->after('task_id')->constrained('task_items')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subtasks', function (Blueprint $table) {
            $table->dropForeign(['task_item_id']);
            $table->dropColumn('task_item_id');
        });
    }
};
