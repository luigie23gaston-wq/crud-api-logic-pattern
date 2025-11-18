<!-- Delete Confirmation Modal -->
<div x-show="showDeleteModal" 
     x-cloak
     @click.self="closeDeleteModal()"
     @keydown.escape.window="closeDeleteModal()"
     style="z-index: 1000000 !important;"
     class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
    <div @click.stop style="z-index: 1000001 !important;" class="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div class="flex items-center gap-3 text-white">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold">Confirm Deletion</h2>
                    <p class="text-sm opacity-90">This action will move the item to trash</p>
                </div>
            </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
            <div class="mb-6">
                <p class="text-gray-700 text-base mb-4">
                    Are you sure you want to delete this 
                    <span class="font-semibold" x-text="deleteModal.type === 'section' ? 'Task Section' : 'Task Card'"></span>?
                </p>
                
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-trash-alt text-red-600 mt-1"></i>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-red-800 mb-1">
                                <span x-text="deleteModal.type === 'section' ? 'Section Title:' : 'Task Title:'"></span>
                            </p>
                            <p class="text-base font-bold text-red-900" x-text="deleteModal.title"></p>
                            
                            <!-- Show task count for sections -->
                            <template x-if="deleteModal.type === 'section' && deleteModal.taskCount">
                                <p class="text-sm text-red-700 mt-2">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    This section contains <span class="font-semibold" x-text="deleteModal.taskCount"></span> task card(s) that will also be deleted.
                                </p>
                            </template>
                            
                            <!-- Show subtask count for tasks -->
                            <template x-if="deleteModal.type === 'task' && deleteModal.subtaskCount">
                                <p class="text-sm text-red-700 mt-2">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    This task contains <span class="font-semibold" x-text="deleteModal.subtaskCount"></span> subtask(s).
                                </p>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div class="flex gap-2">
                    <i class="fas fa-lightbulb text-yellow-600 mt-0.5"></i>
                    <p class="text-xs text-yellow-800">
                        <strong>Note:</strong> Deleted items can be recovered from the Trash Archive.
                    </p>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
            <button @click="closeDeleteModal()" 
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    type="button">
                <i class="fas fa-times mr-1"></i>
                Cancel
            </button>
            <button @click="confirmDelete()" 
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    type="button">
                <i class="fas fa-trash-alt mr-1"></i>
                Delete
            </button>
        </div>
    </div>
</div>
