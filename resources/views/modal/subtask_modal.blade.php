<!-- Subtask Modal (Checklist) -->
<div x-show="showSubtaskModal" 
     x-cloak
     @click.self="closeSubtaskModal()"
     @keydown.escape.window="closeSubtaskModal()"
     style="z-index: 999999 !important;"
     class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
    <div @click.stop style="z-index: 1000000 !important;" class="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        
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
        <div class="p-6 overflow-y-auto flex-1" style="max-height: calc(90vh - 140px);">
            <!-- Checklist Section -->
            <div class="mb-6">
                <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i class="fas fa-tasks text-indigo-600"></i>
                    Subtasks
                </h2>
                
                <!-- Add Subtask Form -->
                <div class="mb-6 p-4 bg-indigo-50 rounded-lg">
                    <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <i class="fas fa-plus-circle text-indigo-600"></i>
                        Add New Subtask
                    </h2>
                    <div>
                        <div class="flex gap-2">
                            <div class="flex-1">
                                <input type="text" 
                                       x-model="subtaskForm.newSubtaskTitle"
                                       placeholder="Enter subtask title..."
                                       @keydown.enter="addNewSubtask()"
                                       @input="subtaskInputError = false"
                                       :class="{
                                           'border-red-500 ring-2 ring-red-200': subtaskInputError,
                                           'border-gray-300': !subtaskInputError
                                       }"
                                       class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                            </div>
                            <button @click="addNewSubtask()" 
                                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap font-medium" 
                                    type="button">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                        <p x-show="subtaskInputError" 
                           x-transition
                           class="text-red-500 text-sm mt-2">
                            Required
                        </p>
                    </div>
                </div>

                <div id="subtasks-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <!-- Subtasks will be rendered by JavaScript to avoid Alpine.js conflicts with Sortable.js -->
                </div>
                
                <!-- Loading Spinner for Subtasks -->
                <div id="subtasks-loading" style="display: none;" class="text-center py-12">
                    <div class="inline-block">
                        <svg class="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="mt-3 text-gray-600 font-medium">Loading subtasks...</p>
                    </div>
                </div>
                
                <!-- Empty State -->
                <div id="subtasks-empty" x-show="subtasks.length === 0" class="text-center py-8 text-gray-400">
                    <i class="fas fa-check-circle text-4xl mb-3 block"></i>
                    <p>No subtasks yet. Add one to get started!</p>
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

                <!-- Comment Input -->
                <div class="mb-4">
                    <textarea 
                        x-model="newComment"
                        id="comment-input"
                        rows="3"
                        placeholder="Write a comment..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        :class="commentInputError ? 'border-red-500' : ''"
                    ></textarea>
                    <p x-show="commentInputError" 
                       x-transition
                       class="text-red-500 text-sm mt-1">
                        Comment cannot be empty
                    </p>
                </div>
                
                <div class="flex justify-end mb-6">
                    <button @click="postComment()" 
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                            type="button">
                        <i class="fas fa-paper-plane"></i>
                        Post Comment
                    </button>
                </div>

                <!-- Comments List -->
                <div id="comments-container" class="space-y-4">
                    <!-- Comments will be rendered by JavaScript -->
                </div>
                
                <!-- Loading Spinner for Comments -->
                <div id="comments-loading" style="display: none;" class="text-center py-8">
                    <div class="inline-block">
                        <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="mt-2 text-gray-600 text-sm">Loading comments...</p>
                    </div>
                </div>

                <!-- Empty State -->
                <div id="comments-empty" class="text-center py-6 text-gray-400">
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
