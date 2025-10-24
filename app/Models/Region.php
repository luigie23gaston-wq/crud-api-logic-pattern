<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $table = 'regions';
    protected $fillable = ['name'];
    public $timestamps = true;

    public function provinces()
    {
        return $this->hasMany(Province::class);
    }
}
