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
        
        // Ensure send button state reflects current input / attachments
        this.updateSendButtonState();
        
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

            // Update send button when input changes
            this.messageInput.addEventListener('input', () => {
                this.updateSendButtonState();
            });
        }
        
        // Listen for attachment changes (dispatched by GchatAttachment)
        document.addEventListener('gchat-attachments-changed', (e) => {
            this.updateSendButtonState();
        });

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
    
    // New: enable/disable send button based on message or attachments
    updateSendButtonState() {
        try {
            const hasText = this.messageInput && this.messageInput.value.trim().length > 0;
            const attachments = window.GchatAttachment ? window.GchatAttachment.getAttachments() : [];
            const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
            if (this.sendButton) {
                this.sendButton.disabled = !(hasText || hasAttachments);
            }
        } catch (err) {
            console.warn('[gchat-simple] updateSendButtonState error', err);
        }
    },

    async sendMessage() {
        const text = this.messageInput.value.trim();
        const attachments = window.GchatAttachment ? window.GchatAttachment.getAttachments() : [];
        
        // Must have either text or attachments
        if (!text && attachments.length === 0) return;
        if (this.state.sendingMessage) return;
        
        this.state.sendingMessage = true;
        this.sendButton.disabled = true;
        
        try {
            // Step 1: Create the message (text can be empty if only attachments)
            const messageText = text || '📎'; // Use attachment emoji if no text
            const formData = new FormData();
            formData.append('message', messageText);
            
            const messageResponse = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });
            
            if (!messageResponse.ok) {
                throw new Error('Failed to send message');
            }
            
            const messageData = await messageResponse.json();
            const newMessage = messageData.message;
            
            // Step 2: Upload attachments if any
            if (attachments.length > 0) {
                console.log('[gchat-simple] Uploading', attachments.length, 'attachments...');
                
                for (const attachment of attachments) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', attachment.file);
                    uploadFormData.append('type', attachment.type);
                    uploadFormData.append('message_id', newMessage.id);
                    
                    console.log('[gchat-simple] Uploading attachment:', attachment.name, 'to message:', newMessage.id);
                    
                    const uploadResponse = await fetch('/chat/upload', {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: uploadFormData
                    });
                    
                    if (!uploadResponse.ok) {
                        const errorText = await uploadResponse.text();
                        console.error('[gchat-simple] Failed to upload attachment:', attachment.name, uploadResponse.status, errorText);
                    } else {
                        const result = await uploadResponse.json();
                        console.log('[gchat-simple] Upload successful:', result);
                    }
                }
                
                // Clear attachments after successful upload
                if (attachments.length > 0 && window.GchatAttachment) {
                    // Already cleared in upload step, but ensure preview cleared
                    window.GchatAttachment.clearAttachments();
                }

                // Make sure send button updates after clearing input/attachments
                this.updateSendButtonState();
            }
            
            // Step 3: Update UI
            this.state.messages.push(newMessage);
            this.state.lastMessageId = newMessage.id;
            
            this.messageInput.value = '';
            this.renderMessages();
            this.scrollToBottom();
            
            // Reload messages after a short delay to get attachments
            if (attachments.length > 0) {
                setTimeout(() => {
                    this.loadMessages();
                }, 500);
            }
            
        } catch (error) {
            console.error('[gchat-simple] Send error:', error);
            alert('Failed to send message');
        } finally {
            this.state.sendingMessage = false;
            this.sendButton.disabled = false;
            // Ensure state reflects current inputs
            this.updateSendButtonState();
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
            
            // Render attachments if present
            let attachmentsHtml = '';
            if (msg.attachments && msg.attachments.length > 0) {
                console.log('[gchat-simple] Rendering attachments for message:', msg.id, msg.attachments);
                attachmentsHtml = msg.attachments.map(att => {
                    console.log('[gchat-simple] Attachment:', att);
                    // Determine if image based on mime_type
                    const isImage = att.mime_type && att.mime_type.startsWith('image/');
                    const filename = att.original_name || 'file';
                    
                    if (isImage) {
                        return `
                            <div class="gchat-msg-image" data-image-url="${att.url}">
                                <img src="${att.url}" alt="${this.escapeHtml(filename)}" />
                            </div>
                        `;
                    } else {
                        const fileIcon = this.getFileIcon(filename);
                        return `
                            <div class="gchat-msg-file" data-file-url="${att.url}" data-file-name="${this.escapeHtml(filename)}">
                                <a href="${att.url}" download="${this.escapeHtml(filename)}" target="_blank">
                                    <i class="fa ${fileIcon}"></i>
                                    <span>${this.escapeHtml(filename)}</span>
                                </a>
                            </div>
                        `;
                    }
                }).join('');
            }
            
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
                        ${msg.message !== '📎' ? `<div class="globalchat-message-text">${this.escapeHtml(msg.message)}</div>` : ''}
                        ${attachmentsHtml}
                    </div>
                </div>
            `;
        }).join('');
        
        if (html) {
            this.messagesContainer.innerHTML = `<div class="globalchat-messages-list">${html}</div>`;
            
            // Attach click handlers for images
            this.messagesContainer.querySelectorAll('.gchat-msg-image').forEach(el => {
                el.addEventListener('click', () => {
                    const imageUrl = el.dataset.imageUrl;
                    this.openImageModal(imageUrl);
                });
            });
            
            // Attach click handlers for file downloads
            this.messagesContainer.querySelectorAll('.gchat-msg-file').forEach(el => {
                el.addEventListener('click', (e) => {
                    const fileUrl = el.dataset.fileUrl;
                    const fileName = el.dataset.fileName;
                    
                    if (fileUrl && fileName) {
                        console.log('[gchat-simple] File download triggered:', fileName);
                        
                        // Add download animation
                        el.classList.add('downloading');
                        setTimeout(() => {
                            el.classList.remove('downloading');
                        }, 600);
                        
                        // Optional: Show download notification
                        // if (window.crudToast) {
                        //     window.crudToast('success', `Downloading ${fileName}...`);
                        // }
                        
                        // The anchor tag will handle the download automatically
                        // Optionally override with: this.downloadFile(fileUrl, fileName);
                    }
                });
            });
            
            this.scrollToBottom();
        } else {
            this.messagesContainer.innerHTML = '<div class="globalchat-empty"><i class="fa fa-comments-o"></i><p>No messages yet. Be the first to say hello!</p></div>';
        }
    },
    
    openImageModal(imageUrl) {
        const modal = document.getElementById('gchat-image-modal');
        const img = document.getElementById('gchat-modal-image');
        const spinner = modal?.querySelector('.gchat-image-spinner');
        
        if (!modal || !img) return;
        
        // Show modal and spinner
        modal.style.display = 'block';
        if (spinner) spinner.style.display = 'flex';
        
        // Reset zoom state
        let currentZoom = 1;
        const maxZoom = 3;
        const minZoom = 0.5;
        const zoomStep = 0.25;
        
        // Set image source and handle load
        img.style.transform = `scale(${currentZoom})`;
        img.style.opacity = '0';
        
        img.onload = () => {
            if (spinner) spinner.style.display = 'none';
            img.style.opacity = '1';
        };
        
        img.onerror = () => {
            if (spinner) spinner.style.display = 'none';
            console.error('[gchat-simple] Failed to load image:', imageUrl);
            // Optionally show error message
        };
        
        img.src = imageUrl;
        
        // Apply zoom
        const applyZoom = (zoom) => {
            currentZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
            img.style.transform = `scale(${currentZoom})`;
        };
        
        // Zoom in button
        const zoomInBtn = modal.querySelector('[data-gchat-zoom-in]');
        if (zoomInBtn) {
            zoomInBtn.onclick = () => applyZoom(currentZoom + zoomStep);
        }
        
        // Zoom out button
        const zoomOutBtn = modal.querySelector('[data-gchat-zoom-out]');
        if (zoomOutBtn) {
            zoomOutBtn.onclick = () => applyZoom(currentZoom - zoomStep);
        }
        
        // Fit to screen button
        const zoomFitBtn = modal.querySelector('[data-gchat-zoom-fit]');
        if (zoomFitBtn) {
            zoomFitBtn.onclick = () => applyZoom(1);
        }
        
        // Close handlers
        const closeModal = () => {
            modal.style.display = 'none';
            img.style.transform = 'scale(1)';
            img.style.opacity = '0';
            img.src = ''; // Clear image source
            if (spinner) spinner.style.display = 'flex'; // Reset spinner for next open
        };
        
        const closeBtns = modal.querySelectorAll('[data-gchat-image-close]');
        closeBtns.forEach(btn => {
            btn.onclick = closeModal;
        });
        
        // Backdrop click
        const backdrop = modal.querySelector('.gchat-image-modal-backdrop');
        if (backdrop) {
            backdrop.onclick = closeModal;
        }
        
        // Keyboard shortcuts
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === '+' || e.key === '=') {
                applyZoom(currentZoom + zoomStep);
            } else if (e.key === '-' || e.key === '_') {
                applyZoom(currentZoom - zoomStep);
            } else if (e.key === '0') {
                applyZoom(1);
            }
        };
        document.addEventListener('keydown', keyHandler);
        
        // Mouse wheel zoom
        img.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
            applyZoom(currentZoom + delta);
        }, { passive: false });
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
    
    getFileIcon(filename) {
        if (!filename) return 'fa-file';
        
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            // Documents
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'txt': 'fa-file-text',
            'rtf': 'fa-file-text',
            // Spreadsheets
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'csv': 'fa-file-excel',
            // Presentations
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            // Archives
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            '7z': 'fa-file-archive',
            'tar': 'fa-file-archive',
            'gz': 'fa-file-archive',
            // Code
            'js': 'fa-file-code',
            'html': 'fa-file-code',
            'css': 'fa-file-code',
            'php': 'fa-file-code',
            'py': 'fa-file-code',
            'java': 'fa-file-code',
            'cpp': 'fa-file-code',
            'json': 'fa-file-code',
            'xml': 'fa-file-code',
            // Images
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'svg': 'fa-file-image',
            'webp': 'fa-file-image',
            // Video
            'mp4': 'fa-file-video',
            'avi': 'fa-file-video',
            'mov': 'fa-file-video',
            'mkv': 'fa-file-video',
            // Audio
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio',
            'flac': 'fa-file-audio',
            'ogg': 'fa-file-audio'
        };
        
        return iconMap[ext] || 'fa-file';
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
    },
    
    downloadFile(url, filename) {
        console.log('[gchat-simple] Downloading file:', filename);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank'; // Fallback for browsers that don't support download attribute
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Chat-specific Toast Notification (Top-Right Position)
 */
function gchatToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `gchat-toast gchat-toast-${type}`;
    
    // Icon based on type
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fa ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('gchat-toast-show'), 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('gchat-toast-show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

/**
 * Attachment Handler for Global Chat
 */
const GchatAttachment = {
    attachments: [],
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 4, // Maximum 4 files total
    
    init() {
        console.log('[gchat-attachment] Initializing...');
        
        // Gear button toggle dropdown
        const gearBtn = document.getElementById('gchat-attachment-btn');
        const dropdown = document.getElementById('gchat-attachment-dropdown');
        
        if (gearBtn && dropdown) {
            gearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = dropdown.style.display !== 'none';
                dropdown.style.display = isVisible ? 'none' : 'block';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!gearBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
            
            // Image input handler
            const imageInput = document.getElementById('gchat-image-input');
            if (imageInput) {
                imageInput.addEventListener('change', (e) => {
                    this.handleFileSelect(e, 'image');
                    dropdown.style.display = 'none';
                });
            }
            
            // File input handler
            const fileInput = document.getElementById('gchat-file-input');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.handleFileSelect(e, 'file');
                    dropdown.style.display = 'none';
                });
            }
            
            console.log('[gchat-attachment] Initialized successfully');
        } else {
            console.warn('[gchat-attachment] Elements not found:', {
                gearBtn: !!gearBtn,
                dropdown: !!dropdown
            });
        }
    },
    
    handleFileSelect(event, type) {
        const files = Array.from(event.target.files);
        if (!files || files.length === 0) return;
        
        // Check total file count (current + new)
        const totalFiles = this.attachments.length + files.length;
        if (totalFiles > this.maxFiles) {
            gchatToast('warning', `Maximum ${this.maxFiles} files allowed. You have ${this.attachments.length} file(s) already selected.`);
            event.target.value = '';
            return;
        }
        
        // Process each file
        for (const file of files) {
            // Validate file size
            if (file.size > this.maxFileSize) {
                gchatToast('error', `${file.name} exceeds 25MB limit`);
                continue;
            }
            
            // Validate image type if selecting from image input
            if (type === 'image' && !file.type.startsWith('image/')) {
                gchatToast('error', `${file.name} is not a valid image`);
                continue;
            }
            
            // Add to attachments array
            const attachment = {
                id: Date.now() + Math.random(),
                file: file,
                type: file.type.startsWith('image/') ? 'image' : 'file',
                name: file.name,
                size: file.size,
                preview: null
            };
            
            // Generate preview for images
            if (attachment.type === 'image') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    attachment.preview = e.target.result;
                    this.attachments.push(attachment);
                    this.renderPreview();
                };
                reader.readAsDataURL(file);
            } else {
                this.attachments.push(attachment);
                this.renderPreview();
            }
        }
        
        // Reset input so same files can be selected again
        event.target.value = '';
    },
    
    renderPreview() {
        const previewContainer = document.getElementById('gchat-preview-container');
        const previewItems = document.getElementById('gchat-preview-items');
        
        if (!previewContainer || !previewItems) return;
        
        if (this.attachments.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }
        
        previewContainer.style.display = 'block';
        previewItems.innerHTML = '';
        
        this.attachments.forEach(att => {
            const div = document.createElement('div');
            div.className = 'gchat-preview-item';
            
            if (att.type === 'image' && att.preview) {
                div.innerHTML = `
                    <img src="${att.preview}" alt="${this.escapeHtml(att.name)}">
                    <button class="gchat-preview-remove" data-attachment-id="${att.id}">
                        <i class="fa fa-times"></i>
                    </button>
                `;
            } else {
                const fileIcon = window.GlobalChat ? window.GlobalChat.getFileIcon(att.name) : 'fa-file';
                div.innerHTML = `
                    <div class="gchat-preview-item-file">
                        <i class="fa ${fileIcon}"></i>
                        <span class="filename">${this.escapeHtml(att.name)}</span>
                    </div>
                    <button class="gchat-preview-remove" data-attachment-id="${att.id}">
                        <i class="fa fa-times"></i>
                    </button>
                `;
            }
            
            previewItems.appendChild(div);
        });
        
        // Attach remove handlers (use currentTarget so clicking nested icon still resolves)
        previewItems.querySelectorAll('.gchat-preview-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget || e.target;
                const id = parseFloat(target.dataset.attachmentId);
                this.removeAttachment(id);
            });
        });

        // After building preview and wiring remove handlers, notify listeners:
        try {
            document.dispatchEvent(new CustomEvent('gchat-attachments-changed', {
                detail: { count: this.attachments.length }
            }));
        } catch (err) {
            console.warn('[gchat-attachment] failed to dispatch attachments-changed', err);
        }

        // Extra safety: call GlobalChat updater directly if available so UI updates immediately
        if (window.GlobalChat && typeof window.GlobalChat.updateSendButtonState === 'function') {
            try { window.GlobalChat.updateSendButtonState(); } catch (e) { /* ignore */ }
        }
    },
    
    removeAttachment(id) {
        this.attachments = this.attachments.filter(a => a.id !== id);
        this.renderPreview();
        // Ensure listeners are notified when attachments change
        try {
            document.dispatchEvent(new CustomEvent('gchat-attachments-changed', {
                detail: { count: this.attachments.length }
            }));
        } catch (err) { /* ignore */ }

        if (window.GlobalChat && typeof window.GlobalChat.updateSendButtonState === 'function') {
            try { window.GlobalChat.updateSendButtonState(); } catch (e) { /* ignore */ }
        }
    },
    
    clearAttachments() {
        this.attachments = [];
        this.renderPreview();
        try {
            document.dispatchEvent(new CustomEvent('gchat-attachments-changed', {
                detail: { count: 0 }
            }));
        } catch (err) { /* ignore */ }

        if (window.GlobalChat && typeof window.GlobalChat.updateSendButtonState === 'function') {
            try { window.GlobalChat.updateSendButtonState(); } catch (e) { /* ignore */ }
        }
    },
    
    getAttachments() {
        return this.attachments;
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GlobalChat.init();
        GchatAttachment.init();
    });
} else {
    GlobalChat.init();
    GchatAttachment.init();
}

// Expose globally
window.GlobalChat = GlobalChat;
window.GchatAttachment = GchatAttachment;


