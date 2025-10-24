<!-- resources/views/modal/image.blade.php -->
<div id="modal-image" class="hidden" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="crud-modal-backdrop" data-modal-backdrop data-modal="image">
        <div class="crud-modal" role="document">
            <div class="crud-modal-header">
                <h3 id="modal-image-title" class="text-lg font-semibold">Image</h3>
                <button type="button" class="modal-close ghost" data-modal-close="image" aria-label="Close image modal"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>
            <div class="crud-modal-body" style="display:flex; align-items:center; justify-content:center;">
                <img id="modal-image-img" src="" alt="Full image" style="max-width:100%; max-height:80vh; object-fit:contain;" />
            </div>
            <div class="crud-modal-footer">
                <button type="button" class="crud-btn crud-btn-ghost" data-modal-close="image">Close</button>
            </div>
        </div>
    </div>
</div>
