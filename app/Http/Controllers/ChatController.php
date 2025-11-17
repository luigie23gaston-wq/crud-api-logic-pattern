<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatMessage;
use App\Models\ChatAttachment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * Get paginated messages
     * Supports: per_page, after (for polling new messages)
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 20);
        $after = $request->get('after'); // Get messages after this ID
        
        $query = ChatMessage::with(['user:id,username', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');
        
        // If polling for new messages
        if ($after) {
            $query->where('id', '>', $after);
        }
        
        $messages = $query->paginate($perPage);
        
        // Add formatted timestamp and attachment URLs for each message
        $messages->getCollection()->transform(function ($message) {
            $message->formatted_time = $message->created_at->timezone('Asia/Manila')->format('M d, Y g:i A');
            
            // Add full URLs to attachments
            if ($message->attachments) {
                $message->attachments->transform(function ($attachment) {
                    $attachment->url = asset($attachment->path);
                    return $attachment;
                });
            }
            
            return $message;
        });
        
        // Reverse data to show oldest first
        $messages->setCollection($messages->getCollection()->reverse()->values());
        
        return response()->json($messages);
    }
    
    /**
     * Store a new message
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);
        
        $message = ChatMessage::create([
            'user_id' => Auth::id(),
            'message' => $validated['message'],
        ]);
        
        // Load user and attachments relationships
        $message->load(['user:id,username', 'attachments']);
        
        // Add formatted timestamp and attachment URLs
        $message->formatted_time = $message->created_at->timezone('Asia/Manila')->format('M d, Y g:i A');
        
        if ($message->attachments) {
            $message->attachments->transform(function ($attachment) {
                $attachment->url = asset($attachment->path);
                return $attachment;
            });
        }
        
        return response()->json([
            'message' => $message
        ], 201);
    }
    
    /**
     * Upload attachment for a chat message
     */
    public function uploadAttachment(Request $request)
    {
        \Log::info('[Chat Upload] Request received', [
            'has_file' => $request->hasFile('file'),
            'type' => $request->input('type'),
            'message_id' => $request->input('message_id')
        ]);
        
        try {
            $validated = $request->validate([
                'file' => 'required|file|max:25600', // 25MB max
                'type' => 'required|in:image,file',
                'message_id' => 'required|exists:chat_messages,id'
            ]);
            
            \Log::info('[Chat Upload] Validation passed');
            
            $file = $request->file('file');
            $type = $validated['type'];
            $messageId = $validated['message_id'];
            
            // Get file info before moving
            $originalName = $file->getClientOriginalName();
            $mimeType = $file->getMimeType();
            $size = $file->getSize();
            $extension = $file->getClientOriginalExtension();
            
            // Determine storage folder based on type
            $folder = $type === 'image' ? 'ImageChatUpload' : 'FileChatUpload';
            
            // Generate unique filename
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            
            // Ensure folder exists
            $folderPath = public_path($folder);
            if (!file_exists($folderPath)) {
                mkdir($folderPath, 0755, true);
            }
            
            // Move file to public folder
            $file->move($folderPath, $filename);
            $relativePath = $folder . '/' . $filename;
            
            \Log::info('[Chat Upload] File moved', ['path' => $relativePath]);
            
            // Create attachment record
            $attachment = ChatAttachment::create([
                'chat_message_id' => $messageId,
                'user_id' => auth()->id(),
                'original_name' => $originalName,
                'path' => $relativePath,
                'mime_type' => $mimeType,
                'size' => $size,
                'type' => $type
            ]);
            
            \Log::info('[Chat Upload] Attachment created', ['id' => $attachment->id]);
            
            return response()->json([
                'success' => true,
                'attachment' => $attachment,
                'url' => asset($relativePath)
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('[Chat Upload] Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('[Chat Upload] Failed to save attachment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to save attachment: ' . $e->getMessage()
            ], 500);
        }
    }
}
