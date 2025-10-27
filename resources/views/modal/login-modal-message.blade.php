<div id="auth-modal-backdrop" class="crud-modal-backdrop hidden" aria-hidden="true">
    <div id="auth-modal" class="crud-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div class="crud-modal-header">
            <h3 id="auth-modal-title" class="modal-title">Message</h3>
            <button class="modal-close" data-modal-close aria-label="Close">
                <!-- Inline SVG X icon (avoids external icon font) -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        </div>
        <div class="crud-modal-body">
            <div id="auth-modal-loading" class="modal-loading hidden" aria-hidden="true">
                <div class="modal-spinner" aria-hidden="true"></div>
                <h2 class="modal-loading-text">Loading…</h2>
            </div>
            <h2 id="auth-modal-message" class="text-base">&nbsp;</h2>
            <h1 id="auth-modal-dots" class="text-base font-medium"></h1>
        </div>
        <div class="crud-modal-footer">
            <button type="button" class="crud-btn" data-modal-close>Close</button>
        </div>
    </div>
</div>
