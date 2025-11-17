<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'icon',
        'icon_color',
        'status',
        'status_color',
        'progress',
        'members',
        'is_archived'
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'progress' => 'integer',
        'members' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function boards()
    {
        return $this->hasMany(Board::class)->orderBy('order');
    }
}
