<!-- Trash Task Archive Modal -->
<div x-show="showTrashModal" 
     x-cloak
     @click.self="closeTrashModal()"
     @keydown.escape.window="closeTrashModal()"
     style="z-index: 999998 !important;"
     class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
    <div @click.stop style="z-index: 999999 !important;" class="bg-white rounded-xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
            <div class="flex justify-between items-center">
                <h1 class="text-xl font-bold text-white flex items-center gap-2">
                    <i class="fas fa-trash-alt"></i>
                    Trash Archive
                </h1>
                <button @click="closeTrashModal()" 
                        class="text-white hover:text-gray-200 transition-colors p-1" 
                        aria-label="Close modal" 
                        type="button">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <p class="text-white text-sm mt-2 opacity-90">
                Deleted sections and task cards • Click restore to recover items
            </p>
        </div>

        <!-- Modal Body - Scrollable Content -->
        <div class="p-6 overflow-y-auto flex-1" style="max-height: calc(90vh - 140px);">
            
            <!-- Deleted Task Sections Table -->
            <div class="mb-8">
                <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-columns text-red-600"></i>
                    Deleted Sections
                    <span class="text-sm font-normal text-gray-500" x-text="'(' + trashedSections.length + ')'"></span>
                </h2>
                
                <div class="overflow-x-auto rounded-lg border border-gray-200">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section Title</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Cards</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted At</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <template x-for="section in trashedSections" :key="section.id">
                                <tr class="hover:bg-gray-50 transition-colors">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="text-sm font-medium text-gray-900" x-text="section.title"></div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800" 
                                              x-text="section.task_items_count + ' cards'"></span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="section.deleted_by_user?.name || 'Unknown'"></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="formatDate(section.deleted_at)"></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button @click="restoreSection(section.id)" 
                                                class="text-green-600 hover:text-green-900 transition-colors px-3 py-1 rounded hover:bg-green-50"
                                                type="button">
                                            <i class="fas fa-undo mr-1"></i>Restore
                                        </button>
                                    </td>
                                </tr>
                            </template>
                            <tr x-show="trashedSections.length === 0">
                                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                                    <i class="fas fa-inbox text-3xl mb-2 block text-gray-300"></i>
                                    No deleted sections
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Deleted Task Cards Table -->
            <div>
                <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-sticky-note text-red-600"></i>
                    Deleted Task Cards
                    <span class="text-sm font-normal text-gray-500" x-text="'(' + trashedTasks.length + ')'"></span>
                </h2>
                
                <div class="overflow-x-auto rounded-lg border border-gray-200">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtasks</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Section</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted At</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <template x-for="task in trashedTasks" :key="task.id">
                                <tr class="hover:bg-gray-50 transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-medium text-gray-900" x-text="task.title"></div>
                                        <div class="text-xs text-gray-500" x-text="task.description ? task.description.substring(0, 50) + '...' : 'No description'"></div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800" 
                                              x-text="task.subtasks_count + ' subtasks'"></span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900" x-text="task.task_section?.title || 'No section'"></div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="task.deleted_by_user?.name || 'Unknown'"></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="formatDate(task.deleted_at)"></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button @click="restoreTask(task.id)" 
                                                class="text-green-600 hover:text-green-900 transition-colors px-3 py-1 rounded hover:bg-green-50"
                                                type="button">
                                            <i class="fas fa-undo mr-1"></i>Restore
                                        </button>
                                    </td>
                                </tr>
                            </template>
                            <tr x-show="trashedTasks.length === 0">
                                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                                    <i class="fas fa-inbox text-3xl mb-2 block text-gray-300"></i>
                                    No deleted task cards
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i>
                    Deleted items are kept for recovery. Restoring will return them to their original location.
                </div>
                <button @click="closeTrashModal()" 
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        type="button">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>
