<div id="modal-archive" class="hidden" aria-hidden="true">
    <div class="crud-modal-backdrop" data-modal-backdrop data-modal="archive">
    <div class="crud-modal crud-modal-large" role="dialog" aria-modal="true" aria-labelledby="modal-archive-title">
            <div class="crud-modal-header">
                <h3 id="modal-archive-title">Archive (Trashed Records)</h3>
                <button type="button" class="modal-close ghost" data-modal-close="archive" aria-label="Close">&times;</button>
            </div>
            <div class="crud-modal-body">
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr>
                                <th class="px-4 py-2">Select</th>
                                <th class="px-4 py-2">First Name</th>
                                <th class="px-4 py-2">Last Name</th>
                                <th class="px-4 py-2">Deleted At</th>
                                <th class="px-4 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody id="archive-table-body">
                            <!-- rows injected by public/js/crud.js -->
                        </tbody>
                    </table>
                </div>

                <div class="mt-4 crud-footer">
                    <div class="crud-footer-left">
                        <div id="archive-pagination-info" class="text-sm">Showing 0 to 0 of 0 entries</div>
                    </div>
                    <div class="crud-footer-right">
                        <div id="archive-pagination" class="flex items-center space-x-2"></div>
                    </div>
                </div>
            </div>
            <div class="crud-modal-footer">
                <button type="button" class="crud-btn crud-btn-ghost" data-modal-close="archive">Close</button>
                <button type="button" class="crud-btn crud-btn-primary" id="archive-restore-selected">Restore Selected</button>
            </div>
        </div>
    </div>
</div>

