/**
 * Global Chat Modal - SIMPLE VERSION (No Alpine.js)
 * Pure vanilla JavaScript with 5-second polling
 */

const GlobalChat = {
    modal: null,
    messagesContainer: null,
    messageInput: null,
    sendButton: null,
    
    state: {
        isOpen: false,
        messages: [],
        currentUserId: 1,
        pollingInterval: null,
        lastMessageId: null,
        oldestMessageId: null,
        hasMoreMessages: true,
        isLoadingOlder: false,
        isFetching: false,
        sendingMessage: false
    },
    
    init() {
        console.log('[gchat-simple] Initializing...');
        
        this.modal = document.getElementById('modal-global-chat-simple');
        if (!this.modal) {
            console.error('[gchat-simple] Modal not found');
            return;
        }
        
        this.messagesContainer = document.getElementById('gchat-messages');
        this.messageInput = document.getElementById('gchat-input');
        this.sendButton = document.getElementById('gchat-send-btn');
        
        this.state.currentUserId = window.currentUserId || 1;
        
        // Event listeners
        this.attachListeners();
        
        // Listen for open event from gear menu
        document.addEventListener('open-gchat', () => this.open());
        
        console.log('[gchat-simple] Initialized successfully');
    },
    
    attachListeners() {
        // Close buttons and backdrop clicks
        const closeBtns = this.modal.querySelectorAll('[data-gchat-close]');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Only close if clicking the backdrop or close button, not the modal content
                if (e.target === e.currentTarget || btn.tagName === 'BUTTON') {
                    this.close();
                }
            });
        });
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.close();
            }
        });
        
        // Send message
        const form = document.getElementById('gchat-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }
        
        // Enter to send (without Shift)
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // Scroll handling
        if (this.messagesContainer) {
            this.messagesContainer.addEventListener('scroll', (e) => this.handleScroll(e));
        }
    },
    
    open() {
        console.log('[gchat-simple] Opening modal...');
        this.state.isOpen = true;
        this.modal.classList.remove('hidden');
        this.modal.setAttribute('aria-hidden', 'false');
        
        // Load initial messages
        this.loadMessages();
        
        // Start polling
        this.startPolling();
    },
    
    close() {
        console.log('[gchat-simple] Closing modal...');
        this.state.isOpen = false;
        this.modal.classList.add('hidden');
        this.modal.setAttribute('aria-hidden', 'true');
        
        // Stop polling
        this.stopPolling();
        
        // Clear input
        if (this.messageInput) {
            this.messageInput.value = '';
        }
    },
    
    async loadMessages() {
        this.state.isFetching = true;
        this.showLoading(true);
        
        try {
            const response = await fetch('/chat/messages?per_page=20', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }
            
            const data = await response.json();
            console.log('[gchat-simple] Loaded messages:', data);
            
            this.state.messages = data.data || [];
            this.state.hasMoreMessages = data.current_page < data.last_page;
            
            if (this.state.messages.length > 0) {
                this.state.oldestMessageId = this.state.messages[0].id;
                this.state.lastMessageId = this.state.messages[this.state.messages.length - 1].id;
            }
            
            this.renderMessages();
            this.scrollToBottom();
            
        } catch (error) {
            console.error('[gchat-simple] Error loading messages:', error);
            this.showError('Failed to load messages');
        } finally {
            this.state.isFetching = false;
            this.showLoading(false);
        }
    },
    
    async pollNewMessages() {
        try {
            const url = this.state.lastMessageId 
                ? `/chat/messages?per_page=20&after=${this.state.lastMessageId}`
                : `/chat/messages?per_page=20`;
                
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            const newMessages = data.data || [];
            
            if (newMessages.length > 0) {
                console.log('[gchat-simple] New messages:', newMessages.length);
                
                this.state.messages = [...this.state.messages, ...newMessages];
                this.state.lastMessageId = newMessages[newMessages.length - 1].id;
                
                // Keep only last 20
                if (this.state.messages.length > 20) {
                    this.state.messages = this.state.messages.slice(-20);
                    this.state.oldestMessageId = this.state.messages[0].id;
                }
                
                this.renderMessages();
                this.scrollToBottom();
            }
            
        } catch (error) {
            console.error('[gchat-simple] Poll error:', error);
        }
    },
    
    startPolling() {
        if (this.state.pollingInterval) return;
        
        console.log('[gchat-simple] Starting 5-second polling...');
        this.state.pollingInterval = setInterval(() => {
            this.pollNewMessages();
        }, 5000);
    },
    
    stopPolling() {
        if (this.state.pollingInterval) {
            clearInterval(this.state.pollingInterval);
            this.state.pollingInterval = null;
            console.log('[gchat-simple] Polling stopped');
        }
    },
    
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || this.state.sendingMessage) return;
        
        this.state.sendingMessage = true;
        this.sendButton.disabled = true;
        
        const formData = new FormData();
        formData.append('message', text);
        
        try {
            const response = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            const data = await response.json();
            this.state.messages.push(data.message);
            this.state.lastMessageId = data.message.id;
            
            this.messageInput.value = '';
            this.renderMessages();
            this.scrollToBottom();
            
        } catch (error) {
            console.error('[gchat-simple] Send error:', error);
            alert('Failed to send message');
        } finally {
            this.state.sendingMessage = false;
            this.sendButton.disabled = false;
        }
    },
    
    renderMessages() {
        if (!this.messagesContainer) return;
        
        const html = this.state.messages.map(msg => {
            const isOwn = msg.user_id == this.state.currentUserId;
            const username = msg.user?.username || 'Unknown';
            const firstLetter = username.charAt(0).toUpperCase();
            // Use formatted_time from backend (Philippine time) or fallback to formatTime
            const time = msg.formatted_time || this.formatTime(msg.created_at);
            
            return `
                <div class="globalchat-message ${isOwn ? 'globalchat-message-own' : ''}">
                    <div class="globalchat-message-avatar">
                        <div class="globalchat-avatar-circle" style="background: linear-gradient(135deg, hsl(${(msg.user_id * 137) % 360}, 70%, 50%), hsl(${(msg.user_id * 211) % 360}, 70%, 60%))">
                            <span>${firstLetter}</span>
                        </div>
                    </div>
                    <div class="globalchat-message-content">
                        <div class="globalchat-message-header">
                            <span class="globalchat-username">${this.escapeHtml(username)}</span>
                            <span class="globalchat-timestamp">${time}</span>
                        </div>
                        <div class="globalchat-message-text">${this.escapeHtml(msg.message)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (html) { this.messagesContainer.innerHTML = `<div class="globalchat-messages-list">${html}</div>`; this.scrollToBottom(); } else { this.messagesContainer.innerHTML = '<div class="globalchat-empty"><i class="fa fa-comments-o"></i><p>No messages yet. Be the first to say hello!</p></div>'; }
    },
    
    handleScroll(event) {
        const container = event.target;
        const scrollTop = container.scrollTop;
        
        if (scrollTop <= 50 && this.state.hasMoreMessages && !this.state.isLoadingOlder) {
            // Load older messages (implement if needed)
        }
    },
    
    scrollToBottom() {
        if (this.messagesContainer) {
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                console.log('[gchat-simple] Scrolled to bottom:', this.messagesContainer.scrollHeight);
            }, 100);
        }
    },
    
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    showLoading(show) {
        const loading = document.getElementById('gchat-loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    },
    
    showError(message) {
        console.error('[gchat-simple]', message);
        if (window.crudToast) {
            window.crudToast('error', message);
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalChat.init());
} else {
    GlobalChat.init();
}

// Expose globally
window.GlobalChat = GlobalChat;

