<!-- Global Chat Modal - SIMPLE VERSION (No Alpine.js) -->
<!-- Dedicated CSS: public/css/gchat.css -->
<link rel="stylesheet" href="{{ asset('css/gchat.css') }}?v={{ time() }}">

<div id="modal-global-chat-simple" class="hidden" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="crud-modal-backdrop" data-gchat-close>
        <div class="crud-modal modal-global-chat-content" role="document">
        
            <!-- Header -->
            <div class="crud-modal-header modal-globalchat-header">
                <h3 class="modal-title">
                    <i class="fa-solid fa-comments"></i> Global Chat
                </h3>
                <button type="button" class="modal-close" data-gchat-close aria-label="Close">
                    <i class="fa fa-times"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="crud-modal-body modal-globalchat-body">
            
                <!-- Loading Indicator -->
                <div id="gchat-loading" class="globalchat-loading" style="display: none; padding: 16px; text-align: center;">
                    <i class="fa fa-spinner fa-spin"></i> Loading messages...
                </div>
            
                <!-- Messages Container with Auto-Scroll -->
                <div id="gchat-messages" class="globalchat-messages-container">
                    <!-- Messages rendered by JavaScript -->
                    <div class="globalchat-empty">
                        <i class="fa fa-comments-o"></i>
                        <p>No messages yet. Be the first to say hello!</p>
                    </div>
                </div>
            
            </div>

            <!-- Footer (Input) -->
            <div class="crud-modal-footer modal-globalchat-footer">
                <form id="gchat-form" class="globalchat-input-form">
                    <div class="globalchat-input-group">
                    
                        <!-- Message Input -->
                        <textarea id="gchat-input"
                                  placeholder="Type a message..."
                                  class="globalchat-input"
                                  rows="1"></textarea>

                        <!-- Send Button -->
                        <button id="gchat-send-btn" 
                                type="submit" 
                                class="globalchat-send-btn">
                            <i class="fa fa-paper-plane"></i>
                        </button>
                    </div>
                </form>
            </div>
        
        </div>
    </div>
</div>
