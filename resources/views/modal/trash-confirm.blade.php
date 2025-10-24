<!-- resources/views/modal/trash-confirm.blade.php -->
<div id="modal-trash-confirm" class="hidden" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="crud-modal-backdrop" data-modal-backdrop data-modal="trash-confirm">
        <div class="crud-modal" role="document">
            <div class="crud-modal-header bg-blue">
                <h3 id="modal-trash-title" class="text-lg font-semibold">Confirm Trash</h3>
                <button type="button" class="modal-close" data-modal-close="trash-confirm" aria-label="Close trash modal"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="crud-modal-body">
               <b> <h3 id="trash-message">Are you sure you want to move the selected records to trash? This will soft-delete them.</h3></b>
            </div>
            <div class="crud-modal-footer">
                <button type="button" class="crud-btn crud-btn-ghost" data-modal-close="trash-confirm">Cancel</button>
                <button type="button" class="crud-btn crud-btn-danger" id="trash-confirm-btn">Trash</button>
            </div>
        </div>
    </div>
</div>