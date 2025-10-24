<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    protected $table = 'cities';

    protected $fillable = [
        'name',
        'province',
        'region',
        'city_type',
        'province_id',
        'region_id',
    ];

    public $timestamps = true;

    public function region()
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function province()
    {
        return $this->belongsTo(Province::class, 'province_id');
    }
}
