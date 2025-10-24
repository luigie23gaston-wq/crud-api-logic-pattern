<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWeatherSearchesTable extends Migration
{
    public function up()
    {
        Schema::create('weather_searches', function (Blueprint $table) {
            $table->id();
            $table->string('city');
            $table->string('country')->nullable();
            $table->json('response')->nullable();
            $table->ipAddress('ip')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('weather_searches');
    }
}
