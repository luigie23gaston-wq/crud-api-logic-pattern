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
        Schema::table('task_sections', function (Blueprint $table) {
            $table->foreignId('project_id')->after('id')->constrained()->cascadeOnDelete();
            $table->string('title')->after('project_id');
            $table->integer('order')->default(0)->after('title');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_sections', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['project_id', 'title', 'order']);
        });
    }
};
