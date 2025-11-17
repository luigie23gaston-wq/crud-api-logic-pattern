<!-- Subtask Modal (Checklist) -->
<div x-show="showSubtaskModal" 
     x-cloak
     @click.self="closeSubtaskModal()"
     @keydown.escape.window="closeSubtaskModal()"
     style="z-index: 999999 !important;"
     class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center overflow-y-auto">
    <div @click.stop style="z-index: 1000000 !important;" class="bg-white rounded-xl w-full max-w-2xl mx-4 my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
        <!-- Modal Header with Gradient -->
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div class="flex justify-between items-center mb-3">
                <h1 class="text-xl font-bold text-white flex items-center gap-2" x-text="currentTaskForSubtasks ? currentTaskForSubtasks.title : 'CHECKLISTS'">
                </h1>
                <button @click="closeSubtaskModal()" 
                        class="text-white hover:text-gray-200 transition-colors p-1" 
                        aria-label="Close modal" 
                        type="button">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- Progress Info -->
            <div class="text-white text-sm space-y-2">
                <div class="flex items-center gap-2">
                    <span x-text="subtasks.filter(s => s.is_completed).length + '/' + subtasks.length"></span>
                    <span>•</span>
                    <span x-text="getSubtaskProgress() + '%'"></span>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                    <div class="bg-white rounded-full h-2 transition-all duration-300" 
                         :style="'width: ' + getSubtaskProgress() + '%'"></div>
                </div>
            </div>
        </div>

        <!-- Modal Body - Scrollable Content -->
        <div class="p-6 overflow-y-auto flex-1">
            <!-- Checklist Section -->
            <div class="mb-6">
                <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-tasks text-indigo-600"></i>
                    Subtasks
                </h2>
                
                <div id="subtasks-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <template x-for="(subtask, index) in subtasks" :key="subtask.id">
                        <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors subtask-item"
                             :data-subtask-id="subtask.id"
                             style="cursor: grab;">
                            
                            <!-- Drag Handle -->
                            <div class="drag-handle p-2" 
                                 style="cursor: grab; color: #6366f1; font-size: 1.25rem;"
                                 title="✋ Drag to reorder">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            
                            <!-- Checkbox -->
                            <div class="pt-1" @mousedown.stop @click.stop>
                                <input type="checkbox" 
                                       class="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer" 
                                       :checked="subtask.is_completed"
                                       @change="toggleSubtaskCompletion(index)">
                            </div>
                            
                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <p class="text-gray-800 font-medium" 
                                   x-text="subtask.title" 
                                   :style="subtask.is_completed ? 'text-decoration: line-through; opacity: 0.6;' : ''"></p>
                                <div class="text-xs text-gray-500 mt-1">
                                    <span x-text="subtask.is_completed ? 'Completed' : 'Pending'"></span>
                                </div>
                            </div>
                            
                            <!-- Delete Button -->
                            <div @mousedown.stop @click.stop>
                                <button @click="removeSubtask(subtask.id)"
                                        class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        type="button"
                                        title="Delete">
                                    <i class="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </template>
                    
                    <!-- Empty State -->
                    <div x-show="subtasks.length === 0" class="text-center py-8 text-gray-400">
                        <i class="fas fa-check-circle text-4xl mb-3 block"></i>
                        <p>No subtasks yet. Add one to get started!</p>
                    </div>
                </div>
            </div>

            <!-- Add Subtask Form -->
            <div class="mb-6 p-4 bg-indigo-50 rounded-lg">
                <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-plus-circle text-indigo-600"></i>
                    Add New Subtask
                </h2>
                <div class="flex gap-2">
                    <input type="text" 
                           x-model="subtaskForm.newSubtaskTitle"
                           placeholder="Enter subtask title..."
                           @keydown.enter="addNewSubtask()"
                           class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <button @click="addNewSubtask()" 
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap font-medium" 
                            type="button">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>

            <!-- Comments Section -->
            <div class="mb-6">
                <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-comments text-indigo-600"></i>
                    Comments
                </h2>
                
                <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-700 mb-2">Attachments</h3>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400">
                        <i class="fas fa-paperclip text-2xl mb-2 block"></i>
                        <p class="text-sm">No attachments yet</p>
                    </div>
                </div>

                <div class="text-center py-6 text-gray-400">
                    <p class="font-semibold text-sm uppercase tracking-wide mb-1">NO COMMENTS YET</p>
                    <p class="text-sm">Be the first one to post a comment.</p>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div class="flex items-center justify-between text-sm text-gray-600">
                <div class="flex items-center gap-2">
                    <span class="font-semibold">Task:</span>
                    <span class="text-gray-800" x-text="currentTaskForSubtasks ? currentTaskForSubtasks.title : 'N/A'"></span>
                </div>
                <button @click="closeSubtaskModal()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        type="button">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>
