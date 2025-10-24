<!-- resources/views/modal/create.blade.php -->
<div id="modal-create" class="hidden" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="crud-modal-backdrop" data-modal-backdrop data-modal="create">
        <div class="crud-modal" role="document">
            <div class="crud-modal-header bg-blue">
                <h3 id="modal-create-title" class="text-lg font-semibold">Create</h3>
                <button type="button" class="modal-close" data-modal-close="create" aria-label="Close create modal"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="crud-modal-body">
                <form id="form-create" enctype="multipart/form-data" novalidate>
                    <div class="mb-3">
                        <label class="block text-sm">First Name</label>
                        <input id="create-firstname" name="firstname" type="text" class="crud-input" data-validate />
                        <p class="form-error hidden" data-error-for="firstname" aria-live="polite"></p>
                    </div>
                    <div class="mb-3">
                        <label class="block text-sm">Last Name</label>
                        <input id="create-lastname" name="lastname" type="text" class="crud-input" data-validate />
                        <p class="form-error hidden" data-error-for="lastname" aria-live="polite"></p>
                    </div>
                    <div class="mb-3">
                        <label class="block text-sm">Image (optional)</label>
                        <input id="create-image" name="image" type="file" class="crud-input" accept="image/*" />
                        <input type="hidden" name="image_path" id="create-image-path" />
                        <div id="create-image-preview" class="img-preview" aria-hidden="true"></div>
                        <!-- Local upload progress (appears when user selects a file) -->
                        <div id="create-upload-local" class="hidden mt-2">
                            <div class="flex items-center gap-x-3 whitespace-nowrap">
                                <div class="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                    <div id="create-upload-fill" class="flex flex-col justify-center rounded-full overflow-hidden bg-teal-500 text-xs text-white text-center whitespace-nowrap" style="width: 0%"></div>
                                </div>
                                <div class="w-10 text-end">
                                    <span id="create-upload-percent" class="text-sm text-gray-800">0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="crud-modal-footer">
                <button type="button" class="crud-btn crud-btn-ghost" data-modal-close="create">Cancel</button>
                <button type="button" class="crud-btn crud-btn-primary" id="create-save">Save</button>
            </div>
        </div>
    </div>
</div>