<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            if (!Schema::hasColumn('cities', 'region_id')) {
                $table->unsignedBigInteger('region_id')->nullable()->after('region');
            }
            if (!Schema::hasColumn('cities', 'province_id')) {
                $table->unsignedBigInteger('province_id')->nullable()->after('province');
            }

            // add foreign keys if the target tables exist
            if (Schema::hasTable('regions')) {
                $table->foreign('region_id')->references('id')->on('regions')->onDelete('set null');
            }
            if (Schema::hasTable('provinces')) {
                $table->foreign('province_id')->references('id')->on('provinces')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cities', function (Blueprint $table) {
            if (Schema::hasColumn('cities', 'province_id')) {
                $table->dropForeign([ 'province_id' ]);
                $table->dropColumn('province_id');
            }
            if (Schema::hasColumn('cities', 'region_id')) {
                $table->dropForeign([ 'region_id' ]);
                $table->dropColumn('region_id');
            }
        });
    }
};
