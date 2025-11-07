<div id="modal-logout" class="crud-modal-backdrop hidden" aria-hidden="true">
    <div class="crud-modal" role="dialog" aria-modal="true" aria-labelledby="modal-logout-title">
        <div class="crud-modal-header">
            <h3 id="modal-logout-title" class="modal-title">Confirm Logout</h3>
            <button class="modal-close" data-modal-close aria-label="Close"><i class="fa fa-times"></i></button>
        </div>
                <div class="crud-modal-body">
                    <b>  <h2 id="logout-confirm-text" class="confirm-logout">Are you sure you want to log out?</h2></b>
                </div>
                <!-- Local loading indicator (fallback when global auth modal is not present) -->
                <div id="logout-modal-loading" class="modal-loading hidden" aria-hidden="true" style="margin:12px;">
                        <div class="modal-spinner" aria-hidden="true"></div>
                        <div class="modal-loading-text">Logging out…</div>
                </div>
        <div class="crud-modal-footer">
            <button type="button" class="crud-btn" data-modal-close>Cancel</button>
            <button id="confirmLogoutBtn" type="button" class="crud-btn crud-btn-primary">Logout</button>
        </div>
    </div>
</div>
