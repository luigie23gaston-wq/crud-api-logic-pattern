<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subtask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_item_id',
        'title',
        'is_completed',
        'order'
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'order' => 'integer',
    ];

    public function taskItem()
    {
        return $this->belongsTo(TaskItem::class, 'task_item_id');
    }
}
