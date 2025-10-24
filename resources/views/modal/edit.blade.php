<!-- resources/views/modal/edit.blade.php -->
<div id="modal-edit" class="hidden" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="crud-modal-backdrop" data-modal-backdrop data-modal="edit">
        <div class="crud-modal" role="document">
            <div class="crud-modal-header bg-blue">
                <h3 id="modal-edit-title" class="text-lg font-semibold">Edit</h3>
                <button type="button" class="modal-close" data-modal-close="edit" aria-label="Close edit modal"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="crud-modal-body">
                <div id="edit-loading" class="modal-loading hidden" aria-hidden="true">
                    <div class="modal-spinner" aria-hidden="true"></div>
                    <div class="modal-loading-text">Fetching…</div>
                </div>
                <form id="form-edit" enctype="multipart/form-data" novalidate>
                    <input type="hidden" name="id" />
                    <div class="mb-3">
                        <label class="block text-sm">First Name</label>
                        <input id="edit-firstname" name="firstname" type="text" class="crud-input" data-validate />
                        <p class="form-error hidden" data-error-for="firstname" aria-live="polite"></p>
                    </div>
                    <div class="mb-3">
                        <label class="block text-sm">Last Name</label>
                        <input id="edit-lastname" name="lastname" type="text" class="crud-input" data-validate />
                        <p class="form-error hidden" data-error-for="lastname" aria-live="polite"></p>
                    </div>
                    <div class="mb-3">
                        <label class="block text-sm">Image (optional)</label>
                        <input id="edit-image" name="image" type="file" class="crud-input" accept="image/*" />
                        <div id="edit-image-preview" class="img-preview" aria-hidden="true"></div>
                    </div>
                </form>
            </div>
            <div class="crud-modal-footer">
                <button type="button" class="crud-btn crud-btn-ghost" data-modal-close="edit">Cancel</button>
                <button type="button" class="crud-btn crud-btn-primary" id="edit-save">Save</button>
            </div>
        </div>
    </div>
</div>