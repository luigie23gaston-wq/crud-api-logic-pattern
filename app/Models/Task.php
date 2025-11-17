<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'title',
        'description',
        'status',
        'due_date',
        'start_date',
        'time_spent_seconds',
        'order'
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'start_date' => 'datetime',
        'time_spent_seconds' => 'integer',
        'order' => 'integer',
    ];

    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    public function subtasks()
    {
        return $this->hasMany(Subtask::class)->orderBy('order');
    }
}
