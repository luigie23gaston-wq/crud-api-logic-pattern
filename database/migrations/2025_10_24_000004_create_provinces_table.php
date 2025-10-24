<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('region_id')->nullable();
            $table->string('name');
            $table->timestamps();

            $table->foreign('region_id')->references('id')->on('regions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provinces');
    }
};
