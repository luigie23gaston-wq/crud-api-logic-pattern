<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'task_items';

    protected $fillable = [
        'project_id',
        'task_section_id',
        'title',
        'description',
        'column',
        'progress',
        'alt_progress',
        'subtasks',
        'date',
        'order',
    ];

    protected $casts = [
        'progress' => 'integer',
        'alt_progress' => 'integer',
        'order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the project this task belongs to
     */
    public function project()
    {
        return $this->belongsTo(\App\Models\Project::class);
    }

    /**
     * Get the section this task belongs to
     */
    public function taskSection()
    {
        return $this->belongsTo(\App\Models\TaskSection::class, 'task_section_id');
    }

    /**
     * Get the subtasks for this task item
     */
    public function subtasks()
    {
        return $this->hasMany(\App\Models\Subtask::class, 'task_item_id')->orderBy('order');
    }
}
