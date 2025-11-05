<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_message_id',
        'user_id',
        'path',
        'original_name',
        'mime_type',
        'size'
    ];

    /**
     * Append filename accessor to JSON
     */
    protected $appends = ['filename', 'type'];

    /**
     * Get filename (alias for original_name)
     */
    public function getFilenameAttribute()
    {
        return $this->original_name;
    }

    /**
     * Get type based on mime_type
     */
    public function getTypeAttribute()
    {
        return $this->mime_type && str_starts_with($this->mime_type, 'image/') ? 'image' : 'file';
    }

    /**
     * Relationship: Attachment belongs to a chat message
     */
    public function chatMessage()
    {
        return $this->belongsTo(ChatMessage::class);
    }

    /**
     * Relationship: Attachment belongs to a user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
