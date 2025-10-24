<!-- resources/views/modal/view.blade.php -->
<div id="modal-view" class="hidden" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="crud-modal-backdrop" data-modal-backdrop data-modal="view">
        <div class="crud-modal" role="document">
            <div class="crud-modal-header bg-blue">
                <h3 id="modal-view-title" class="text-lg font-semibold">View</h3>
                <button type="button" class="modal-close ghost" data-modal-close="view" aria-label="Close view modal"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="crud-modal-body">
                <div id="view-loading" class="modal-loading hidden" aria-hidden="true">
                    <div class="modal-spinner" aria-hidden="true"></div>
                    <div class="modal-loading-text">Fetching…</div>
                </div>
                <div id="view-content" aria-live="polite">
                    <!-- Filled by JS -->
                </div>
            </div>
            <div class="crud-modal-footer">
                <button type="button" class="crud-btn crud-btn-ghost" data-modal-close="view">Close</button>
            </div>
        </div>
    </div>
</div>