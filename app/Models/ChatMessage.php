<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'message',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who sent the message
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all attachments for this message
     */
    public function attachments()
    {
        return $this->hasMany(ChatAttachment::class);
    }
}
