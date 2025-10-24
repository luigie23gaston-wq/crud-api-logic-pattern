<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherSearch extends Model
{
    protected $fillable = [
        'city',
        'country',
        'response',
        'ip',
    ];

    protected $casts = [
        'response' => 'array',
    ];
}
