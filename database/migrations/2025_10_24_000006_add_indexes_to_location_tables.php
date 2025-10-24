<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cities')) {
            Schema::table('cities', function (Blueprint $table) {
                $table->index('name', 'idx_cities_name');
                if (!Schema::hasColumn('cities', 'province_id') === false) {
                    $table->index('province_id', 'idx_cities_province_id');
                }
                if (!Schema::hasColumn('cities', 'region_id') === false) {
                    $table->index('region_id', 'idx_cities_region_id');
                }
            });
        }

        if (Schema::hasTable('provinces')) {
            Schema::table('provinces', function (Blueprint $table) {
                $table->index('name', 'idx_provinces_name');
            });
        }

        if (Schema::hasTable('regions')) {
            Schema::table('regions', function (Blueprint $table) {
                $table->index('name', 'idx_regions_name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('cities')) {
            Schema::table('cities', function (Blueprint $table) {
                $table->dropIndex('idx_cities_name');
                if (!Schema::hasColumn('cities', 'province_id') === false) {
                    $table->dropIndex('idx_cities_province_id');
                }
                if (!Schema::hasColumn('cities', 'region_id') === false) {
                    $table->dropIndex('idx_cities_region_id');
                }
            });
        }

        if (Schema::hasTable('provinces')) {
            Schema::table('provinces', function (Blueprint $table) {
                $table->dropIndex('idx_provinces_name');
            });
        }

        if (Schema::hasTable('regions')) {
            Schema::table('regions', function (Blueprint $table) {
                $table->dropIndex('idx_regions_name');
            });
        }
    }
};
