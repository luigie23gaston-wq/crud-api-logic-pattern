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
        Schema::table('task_items', function (Blueprint $table) {
            $table->foreignId('task_section_id')->nullable()->after('project_id')->constrained('task_sections')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_items', function (Blueprint $table) {
            $table->dropForeign(['task_section_id']);
            $table->dropColumn('task_section_id');
        });
    }
};
