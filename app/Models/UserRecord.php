<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserRecord extends Model
{
    use SoftDeletes;

    protected $table = 'user_records';
    protected $fillable = ['firstname','lastname','image','created_by'];

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
