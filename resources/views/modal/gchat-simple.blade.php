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
                
                    <!-- Attachment Preview Area (appears above input when files selected) -->
                    <div id="gchat-preview-container" class="gchat-preview-container" style="display: none;">
                        <div id="gchat-preview-items" class="gchat-preview-items">
                            <!-- Preview thumbnails rendered by JavaScript -->
                        </div>
                    </div>
                
                    <div class="globalchat-input-group" style="position: relative;">
                    
                        <!-- Attachment Dropdown (appears ABOVE gear button) -->
                        <div id="gchat-attachment-dropdown" class="gchat-attachment-dropdown" style="display: none;">
                            <label class="gchat-attachment-option">
                                <input type="file" 
                                       id="gchat-image-input" 
                                       accept="image/*" 
                                       multiple
                                       style="display: none;">
                                <i class="fa fa-image"></i>
                                <span>Image</span>
                            </label>
                            <label class="gchat-attachment-option">
                                <input type="file" 
                                       id="gchat-file-input" 
                                       accept="*/*" 
                                       multiple
                                       style="display: none;">
                                <i class="fa fa-file"></i>
                                <span>File</span>
                            </label>
                        </div>
                    
                        <!-- Gear Button (Attachment Options) -->
                        <button type="button" 
                                id="gchat-attachment-btn" 
                                class="globalchat-send-btn"
                                aria-label="Attach file"
                                style="margin-right: 8px;">
                            <i class="fa fa-cog"></i>
                        </button>
                    
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

{{-- Include Image Zoom Modal (displays on top of this modal) --}}
@includeWhen(file_exists(resource_path('views/modal/gchat-image.blade.php')), 'modal.gchat-image')
