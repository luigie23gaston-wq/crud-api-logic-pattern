<!-- Task Modal (Create/Edit) -->
<div x-show="showModal" 
     x-cloak
     @click.self="closeModal()"
     @keydown.escape.window="closeModal()"
     style="z-index: 999999 !important;"
     class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center overflow-y-auto">
    <div @click.stop style="z-index: 1000000 !important;" class="bg-white rounded-xl max-w-lg w-full mx-4 my-8 shadow-2xl overflow-hidden relative">
        
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-green-500 to-purple-600 px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-bold text-white">
                <span x-show="!editingTask">Create New Task</span>
                <span x-show="editingTask">Edit Task</span>
            </h3>
            <button @click="closeModal()" class="text-white hover:text-gray-200 transition-colors p-1" aria-label="Close modal" type="button">
                <i class="fas fa-times text-xl"></i>
            </button>
        </div>
        
        <!-- Modal Body -->
        <form @submit.prevent="saveTask()" class="p-6">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Task Title <span class="text-red-500">*</span></label>
                    <input type="text" 
                           x-model="modalForm.title" 
                           required 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                           placeholder="Enter task title">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea x-model="modalForm.description"
                              rows="4"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              placeholder="Enter task description (optional)"></textarea>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" 
                        @click="closeModal()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                    Cancel
                </button>
                <button type="submit" 
                        class="px-4 py-2 bg-gradient-to-r from-green-500 to-purple-600 text-white rounded-lg hover:from-green-600 hover:to-purple-700 transition-all">
                    <span x-show="!editingTask">Create Task</span>
                    <span x-show="editingTask">Save Changes</span>
                </button>
            </div>
        </form>
    </div>
</div>
