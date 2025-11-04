<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Auth;

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
        
        $query = ChatMessage::with('user:id,username')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc');
        
        // If polling for new messages
        if ($after) {
            $query->where('id', '>', $after);
        }
        
        $messages = $query->paginate($perPage);
        
        // Add formatted timestamp for each message
        $messages->getCollection()->transform(function ($message) {
            $message->formatted_time = $message->created_at->timezone('Asia/Manila')->format('M d, Y g:i A');
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
        
        // Load user relationship
        $message->load('user:id,username');
        
        // Add formatted timestamp
        $message->formatted_time = $message->created_at->timezone('Asia/Manila')->format('M d, Y g:i A');
        
        return response()->json([
            'message' => $message
        ], 201);
    }
}
