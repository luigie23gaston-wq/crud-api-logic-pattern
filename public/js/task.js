let taskManager_instance = null;

function taskManager() {
    if (taskManager_instance) return taskManager_instance;
    
    taskManager_instance = {
        projectId: document.querySelector('[data-project-id]')?.getAttribute('data-project-id') || '',
        draggedTask: null,
        draggedFrom: null,
        draggedSection: null,
        draggedSubtaskIndex: null,
        subtaskSortable: null,
        taskSortables: [],
        selectedSection: null,
        editingTask: null,
        showModal: false,
        showSubtaskModal: false,
        showTrashModal: false,
        showDeleteModal: false,
        currentTaskForSubtasks: null,
        subtaskInputError: false,
        commentInputError: false,
        
        sections: [],
        subtasks: [],
        comments: [],
        trashedSections: [],
        trashedTasks: [],
        newComment: '',
        editingCommentId: null,
        
        deleteModal: {
            type: '', // 'section' or 'task'
            id: null,
            title: '',
            taskCount: 0,
            subtaskCount: 0
        },
        
        modalForm: {
            title: '',
            description: '',
            progress: 0,
            date: '',
            subtasks: '0/0'
        },
        
        subtaskForm: {
            newSubtaskTitle: ''
        },
        
        // Cache DOM elements and CSRF token
        _cache: {
            csrfToken: null,
            domElements: {}
        },
        
        init() {
            this._cache.csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!this.projectId) {
                console.error('Project ID not found');
                return;
            }
            this.loadSections();
        },
        
        // Optimized section loading with caching
        async loadSections() {
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/sections`);
                if (data.ok) {
                    this.sections = this._processSectionsData(data.sections);
                    this._initTaskCardSortables();
                }
            } catch (err) {
                console.error('Error loading sections:', err);
            }
        },
        
        _processSectionsData(sections) {
            return (sections || []).map(section => ({
                ...section,
                editing: false,
                originalTitle: section.title,
                task_items: (section.task_items || []).map(task => ({
                    ...task,
                    subtasks: this._ensureSubtasksArray(task.subtasks)
                }))
            }));
        },
        
        _ensureSubtasksArray(subtasks) {
            if (Array.isArray(subtasks)) return subtasks;
            if (typeof subtasks === 'string' && subtasks) {
                try {
                    return JSON.parse(subtasks);
                } catch (e) {
                    console.warn('Failed to parse subtasks:', e);
                }
            }
            return [];
        },
        
        // Optimized sortable initialization
        _initTaskCardSortables() {
            // Clear existing sortables
            this._destroyTaskSortables();
            
            requestAnimationFrame(() => {
                const containers = document.querySelectorAll('.section-tasks');
                this.taskSortables = Array.from(containers).map(container => {
                    const sectionEl = container.closest('.task-section');
                    if (!sectionEl) return null;
                    
                    const sectionIndex = parseInt(sectionEl.dataset.sectionIndex);
                    if (isNaN(sectionIndex) || !this.sections[sectionIndex]) return null;
                    
                    return Sortable.create(container, {
                        group: 'tasks',
                        animation: 150,
                        ghostClass: 'task-card-ghost',
                        chosenClass: 'task-card-chosen',
                        dragClass: 'task-card-dragging',
                        draggable: '.task-card',
                        forceFallback: false,
                        fallbackTolerance: 3,
                        onEnd: (evt) => this._handleTaskDragEnd(evt)
                    });
                }).filter(Boolean);
            });
        },
        
        _destroyTaskSortables() {
            this.taskSortables.forEach(sortable => {
                try {
                    sortable.destroy();
                } catch (e) {
                    // Silent fail - sortable already destroyed
                }
            });
            this.taskSortables = [];
        },
        
        async _handleTaskDragEnd(evt) {
            // Clean up drag classes immediately
            this._cleanupDragClasses();
            
            const { from, to, oldIndex, newIndex } = evt;
            const fromSectionEl = from.closest('.task-section');
            const toSectionEl = to.closest('.task-section');
            
            const fromIndex = parseInt(fromSectionEl?.dataset.sectionIndex);
            const toIndex = parseInt(toSectionEl?.dataset.sectionIndex);
            
            if (isNaN(fromIndex) || isNaN(toIndex)) {
                console.error('Invalid section indexes', { fromIndex, toIndex });
                this.loadSections();
                return;
            }
            
            const taskCard = evt.item;
            const taskId = this._getTaskIdFromElement(taskCard);
            
            if (!taskId) {
                console.error('Task ID not found on card');
                this.loadSections();
                return;
            }
            
            try {
                if (fromIndex !== toIndex) {
                    await this._moveTaskBetweenSections(taskId, fromIndex, toIndex, newIndex);
                } else {
                    await this._reorderTasksInSection(toIndex);
                }
            } catch (error) {
                console.error('Error during drag operation:', error);
                this.loadSections();
            }
        },
        
        _cleanupDragClasses() {
            document.querySelectorAll('.task-card').forEach(card => {
                card.classList.remove('task-card-ghost', 'task-card-chosen', 'task-card-dragging');
                card.style.opacity = '';
                card.style.transform = '';
            });
        },
        
        _getTaskIdFromElement(element) {
            return parseInt(element.dataset.taskId || element.getAttribute('data-task-id'));
        },
        
        async _moveTaskBetweenSections(taskId, fromIndex, toIndex, newIndex) {
            const toSection = this.sections[toIndex];
            if (!toSection) throw new Error('Target section not found');
            
            // Optimistic UI update
            const fromSection = this.sections[fromIndex];
            const taskIndex = fromSection.task_items.findIndex(t => t.id === taskId);
            if (taskIndex === -1) throw new Error('Task not found in source section');
            
            const [movedTask] = fromSection.task_items.splice(taskIndex, 1);
            toSection.task_items.splice(newIndex, 0, movedTask);
            
            try {
                await this._updateTaskSection(taskId, toSection.id, newIndex + 1);
                this.showToast('Task moved successfully');
            } catch (error) {
                // Revert optimistic update on failure
                fromSection.task_items.splice(taskIndex, 0, movedTask);
                toSection.task_items.splice(newIndex, 1);
                throw error;
            }
        },
        
        async _reorderTasksInSection(sectionIndex) {
            const section = this.sections[sectionIndex];
            if (!section) throw new Error('Section not found');
            
            const container = document.querySelector(`[data-section-index="${sectionIndex}"] .section-tasks`);
            if (!container) throw new Error('Section container not found');
            
            const taskCards = Array.from(container.children);
            const reorderedTasks = taskCards.map((card, index) => ({
                id: this._getTaskIdFromElement(card),
                order: index + 1
            })).filter(task => task.id && !isNaN(task.id));
            
            if (reorderedTasks.length === 0) return;
            
            // Update order locally for immediate feedback
            reorderedTasks.forEach(rt => {
                const task = section.task_items.find(t => t.id === rt.id);
                if (task) task.order = rt.order;
            });
            
            try {
                await this._reorderTasksInBackend(section.id, reorderedTasks);
            } catch (error) {
                // Reload on error to sync with server state
                this.loadSections();
                throw error;
            }
        },
        
        // Optimized API calls
        async _fetch(url, options = {}) {
            // Ensure method is explicitly set (default to GET if not provided)
            const method = options.method || 'GET';
            
            // Build config with method first to ensure it's not lost
            const config = {
                method: method,
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this._cache.csrfToken,
                    ...(options.headers || {})
                }
            };
            
            // Add body if provided
            if (options.body) {
                if (typeof options.body === 'string') {
                    config.body = options.body;
                    // Set Content-Type for JSON strings if not already set
                    if (!config.headers['Content-Type']) {
                        config.headers['Content-Type'] = 'application/json';
                    }
                } else {
                    config.headers['Content-Type'] = 'application/json';
                    config.body = JSON.stringify(options.body);
                }
            }
            
            try {
                const response = await fetch(url, config);
                const data = await response.json().catch(() => ({}));
                
                // Return both response and parsed data
                return {
                    ok: response.ok,
                    status: response.status,
                    ...data
                };
            } catch (error) {
                console.error('Fetch error:', error);
                return { ok: false, status: 0, message: 'Network error' };
            }
        },
        
        async _updateTaskSection(taskId, sectionId, order) {
            const data = await this._fetch(`/tasks/${this.projectId}/items/${taskId}`, {
                method: 'POST',
                body: { task_section_id: sectionId, order }
            });
            if (!data.ok) throw new Error('Failed to move task');
            return data;
        },
        
        async _reorderTasksInBackend(sectionId, tasks) {
            const data = await this._fetch(`/tasks/${this.projectId}/sections/${sectionId}/reorder-items`, {
                method: 'POST',
                body: { items: tasks }
            });
            if (!data.ok) throw new Error('Failed to reorder tasks');
            return data;
        },
        
        // Optimized section management
        showAddSectionModal() {
            const tempSection = {
                id: 'temp_' + Date.now(),
                project_id: parseInt(this.projectId),
                title: '',
                order: this.sections.length + 1,
                task_items: [],
                editing: true,
                isNew: true,
                originalTitle: ''
            };
            
            this.sections.push(tempSection);
            
            this._focusElement('.section-title-input:last-of-type');
        },
        
        editSectionTitle(section) {
            section.editing = true;
            section.originalTitle = section.title;
            this._focusElement('.section-title-input', section.title);
        },
        
        async saveSectionTitle(section) {
            const trimmedTitle = section.title.trim();
            
            if (!trimmedTitle) {
                this.cancelSectionEdit(section);
                return;
            }
            
            try {
                if (section.isNew) {
                    await this._createSection(trimmedTitle, section);
                } else {
                    await this._updateSection(section, trimmedTitle);
                }
            } catch (error) {
                console.error('Error saving section:', error);
                this.cancelSectionEdit(section);
                this.showToast('Error saving section');
            }
        },
        
        async _createSection(title, tempSection) {
            const data = await this._fetch(`/tasks/${this.projectId}/sections`, {
                method: 'POST',
                body: { title }
            });
            if (data.ok) {
                const index = this.sections.findIndex(s => s.id === tempSection.id);
                if (index !== -1) {
                    this.sections[index] = {
                        ...data.section,
                        task_items: [],
                        editing: false,
                        originalTitle: data.section.title
                    };
                }
                this.showToast('Section created');
            } else {
                throw new Error('Server rejected section creation');
            }
        },
        
        async _updateSection(section, title) {
            const data = await this._fetch(`/tasks/${this.projectId}/sections/${section.id}`, {
                method: 'POST',
                body: { title }
            });
            if (data.ok) {
                section.editing = false;
                section.originalTitle = title;
                this.showToast('Section updated');
            } else {
                throw new Error('Server rejected section update');
            }
        },
        
        cancelSectionEdit(section) {
            if (section.isNew) {
                this.sections = this.sections.filter(s => s.id !== section.id);
            } else {
                section.title = section.originalTitle;
                section.editing = false;
            }
        },
        
        deleteSection(sectionId) {
            const section = this.sections.find(s => s.id === sectionId);
            if (!section) return;
            
            this.deleteModal = {
                type: 'section',
                id: sectionId,
                title: section.title,
                taskCount: section.task_items?.length || 0,
                subtaskCount: 0
            };
            this.showDeleteModal = true;
        },
        
        async executeDeleteSection(sectionId) {
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/sections/${sectionId}`, {
                    method: 'DELETE'
                });
                if (data.ok) {
                    this.sections = this.sections.filter(s => s.id !== sectionId);
                    this.showToast('Section deleted');
                }
            } catch (err) {
                console.error('Error deleting section:', err);
                this.showToast('Error deleting section');
            }
        },
        
        // Optimized task management
        showAddTaskModal(section) {
            this._prepareTaskModal(null, section);
        },
        
        editTask(task) {
            const section = this.sections.find(s => s.task_items.some(t => t.id === task.id));
            this._prepareTaskModal(task, section);
        },
        
        _prepareTaskModal(task, section) {
            this.editingTask = task;
            this.selectedSection = section;
            this.modalForm = task ? {
                title: task.title,
                description: task.description || '',
                progress: task.progress,
                date: task.date || '',
                subtasks: task.subtasks
            } : { title: '', description: '', progress: 0, date: '', subtasks: '0/0' };
            
            this.showModal = true;
        },
        
        async saveTask() {
            if (!this.modalForm.title.trim()) {
                alert('Task title is required');
                return;
            }
            
            if (!this.selectedSection) {
                alert('Please select a section');
                return;
            }
            
            const payload = {
                task_section_id: this.selectedSection.id,
                title: this.modalForm.title,
                description: this.modalForm.description || '',
                column: 'eicaer',
                progress: parseInt(this.modalForm.progress) || 0,
                alt_progress: parseInt(this.modalForm.progress) || 0,
                subtasks: this.modalForm.subtasks,
                date: this.modalForm.date || ''
            };
            
            const isEdit = !!this.editingTask;
            const endpoint = isEdit 
                ? `/tasks/${this.projectId}/items/${this.editingTask.id}`
                : `/tasks/${this.projectId}/items`;
            
            try {
                const data = await this._fetch(endpoint, {
                    method: 'POST',
                    body: payload
                });
                if (data.ok) {
                    this._updateTaskInUI(data.item, isEdit);
                    this.closeModal();
                    this.showToast(`Task ${isEdit ? 'updated' : 'created'} successfully!`);
                }
            } catch (err) {
                console.error('Error saving task:', err);
                alert('Error saving task');
            }
        },
        
        _updateTaskInUI(taskData, isEdit) {
            const section = this.sections.find(s => s.id === this.selectedSection.id);
            if (!section) return;
            
            if (isEdit) {
                const index = section.task_items.findIndex(t => t.id === this.editingTask.id);
                if (index !== -1) {
                    section.task_items[index] = taskData;
                }
            } else {
                if (!section.task_items) section.task_items = [];
                section.task_items.push(taskData);
            }
        },
        
        closeModal() {
            this.showModal = false;
            this.editingTask = null;
            this.modalForm = { title: '', description: '', progress: 0, date: '', subtasks: '0/0' };
        },
        
        deleteTask(taskId) {
            let task = null;
            for (const section of this.sections) {
                task = section.task_items.find(t => t.id === taskId);
                if (task) break;
            }
            if (!task) return;
            
            this.deleteModal = {
                type: 'task',
                id: taskId,
                title: task.title,
                taskCount: 0,
                subtaskCount: task.subtasks?.length || 0
            };
            this.showDeleteModal = true;
        },
        
        async executeDeleteTask(taskId) {
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/items/${taskId}`, {
                    method: 'DELETE'
                });
                if (data.ok) {
                    this.sections.forEach(section => {
                        section.task_items = section.task_items.filter(t => t.id !== taskId);
                    });
                    this.showToast('Task deleted');
                }
            } catch (err) {
                console.error('Error deleting task:', err);
                this.showToast('Error deleting task');
            }
        },
        
        // Optimized inline task editing
        startEditTaskTitle(task) {
            task.originalTitle = task.title;
            task.editing = true;
            this._focusElement('.task-card-title-input', task.title);
        },
        
        async saveTaskTitle(task) {
            const trimmedTitle = task.title.trim();
            
            if (!trimmedTitle) {
                task.title = task.originalTitle;
                task.editing = false;
                return;
            }
            
            if (trimmedTitle === task.originalTitle) {
                task.editing = false;
                return;
            }
            
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/items/${task.id}`, {
                    method: 'POST',
                    body: { title: trimmedTitle }
                });
                if (data.ok) {
                    task.editing = false;
                    task.originalTitle = trimmedTitle;
                    this.showToast('Task title updated');
                } else {
                    throw new Error('Server rejected update');
                }
            } catch (err) {
                console.error('Error updating task title:', err);
                task.title = task.originalTitle;
                task.editing = false;
                this.showToast('Error updating task title');
            }
        },
        
        cancelEditTaskTitle(task) {
            task.title = task.originalTitle;
            task.editing = false;
        },
        
        // Optimized subtask management
        openSubtaskModal(task) {
            this.currentTaskForSubtasks = task;
            this.subtaskForm.newSubtaskTitle = '';
            this.newComment = '';
            this.commentInputError = false;
            this.showSubtaskModal = true;
            this.loadSubtasks(task.id);
            this.loadComments(task.id);
        },
        
        initSubtaskSortable() {
            const container = document.getElementById('subtasks-container');
            if (!container) {
                console.error('Subtasks container not found');
                return;
            }
            
            if (this.subtaskSortable) {
                this.subtaskSortable.destroy();
            }
            
            this.subtaskSortable = Sortable.create(container, {
                animation: 150,
                handle: '.drag-handle',
                draggable: '.subtask-item',
                ghostClass: 'subtask-ghost',
                chosenClass: 'subtask-chosen',
                dragClass: 'subtask-dragging',
                onEnd: (evt) => this._handleSubtaskDragEnd(evt)
            });
        },
        
        async _handleSubtaskDragEnd(evt) {
            const { oldIndex, newIndex } = evt;
            
            if (oldIndex === newIndex) return;
            
            // Read the new order from DOM after drag
            const container = document.getElementById('subtasks-container');
            if (!container) return;
            
            const subtaskElements = Array.from(container.querySelectorAll('.subtask-item'));
            const newOrder = subtaskElements.map((el, idx) => {
                const subtaskId = parseInt(el.getAttribute('data-subtask-id'));
                const subtask = this.subtasks.find(s => s.id === subtaskId);
                return subtask ? { ...subtask, order: idx + 1 } : null;
            }).filter(Boolean);
            
            // Update the array with new order
            this.subtasks = newOrder;
            
            // Save to backend
            await this._reorderSubtasks();
        },
        
        async loadSubtasks(taskId) {
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/items/${taskId}/subtasks`);
                if (data.ok) {
                    this.subtasks = data.subtasks || [];
                    requestAnimationFrame(() => {
                        this.renderSubtasks();
                        this.initSubtaskSortable();
                    });
                }
            } catch (err) {
                console.error('Error loading subtasks:', err);
            }
        },
        
        renderSubtasks() {
            const container = document.getElementById('subtasks-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            this.subtasks.forEach((subtask, index) => {
                const item = document.createElement('div');
                item.className = 'flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors subtask-item';
                item.setAttribute('data-subtask-id', subtask.id);
                item.style.cursor = 'grab';
                
                item.innerHTML = `
                    <!-- Drag Handle -->
                    <div class="drag-handle p-2" 
                         style="cursor: grab; color: #6366f1; font-size: 1.25rem;"
                         title="✋ Drag to reorder">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    
                    <!-- Checkbox -->
                    <div class="pt-1">
                        <input type="checkbox" 
                               class="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer" 
                               ${subtask.is_completed ? 'checked' : ''}
                               data-index="${index}">
                    </div>
                    
                    <!-- Content -->
                    <div class="flex-1 min-w-0 subtask-content" data-subtask-id="${subtask.id}">
                        <p class="text-gray-800 font-medium subtask-title-text" 
                           style="${subtask.is_completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this._escapeHtml(subtask.title)}</p>
                        <input type="text" 
                               class="subtask-title-input hidden w-full px-2 py-1 border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                               value="${this._escapeHtml(subtask.title)}">
                        <div class="text-xs text-gray-500 mt-1">
                            <span>${subtask.is_completed ? 'Completed' : 'Pending'}</span>
                        </div>
                    </div>
                    
                    <!-- Delete Button -->
                    <div>
                        <button class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors delete-subtask"
                                type="button"
                                title="Delete"
                                data-subtask-id="${subtask.id}">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                `;
                
                // Add event listeners
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    this.toggleSubtaskCompletion(index);
                });
                
                const deleteBtn = item.querySelector('.delete-subtask');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeSubtask(subtask.id);
                });
                
                // Add inline editing for title
                const contentDiv = item.querySelector('.subtask-content');
                const titleText = contentDiv.querySelector('.subtask-title-text');
                const titleInput = contentDiv.querySelector('.subtask-title-input');
                
                titleText.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startEditSubtaskTitle(subtask.id, titleText, titleInput);
                });
                
                titleInput.addEventListener('blur', () => {
                    this.saveSubtaskTitle(subtask.id, titleText, titleInput);
                });
                
                titleInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.saveSubtaskTitle(subtask.id, titleText, titleInput);
                    } else if (e.key === 'Escape') {
                        this.cancelEditSubtaskTitle(titleText, titleInput);
                    }
                });
                
                container.appendChild(item);
            });
        },
        
        startEditSubtaskTitle(subtaskId, titleText, titleInput) {
            titleText.classList.add('hidden');
            titleInput.classList.remove('hidden');
            titleInput.focus();
            titleInput.select();
        },
        
        async saveSubtaskTitle(subtaskId, titleText, titleInput) {
            const newTitle = titleInput.value.trim();
            
            if (!newTitle) {
                this.showToast('Subtask title cannot be empty', 'error');
                this.cancelEditSubtaskTitle(titleText, titleInput);
                return;
            }
            
            const subtask = this.subtasks.find(s => s.id === subtaskId);
            if (!subtask || subtask.title === newTitle) {
                this.cancelEditSubtaskTitle(titleText, titleInput);
                return;
            }
            
            try {
                const data = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks/${subtaskId}`,
                    {
                        method: 'POST',
                        body: { title: newTitle }
                    }
                );
                if (data.ok) {
                    subtask.title = newTitle;
                    titleText.textContent = newTitle;
                    titleInput.value = newTitle;
                    this.showToast('Subtask updated');
                }
                
                this.cancelEditSubtaskTitle(titleText, titleInput);
            } catch (err) {
                console.error('Error updating subtask:', err);
                this.cancelEditSubtaskTitle(titleText, titleInput);
            }
        },
        
        cancelEditSubtaskTitle(titleText, titleInput) {
            titleInput.classList.add('hidden');
            titleText.classList.remove('hidden');
        },
        
        _escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        closeSubtaskModal() {
            this.showSubtaskModal = false;
            this.currentTaskForSubtasks = null;
            this.subtasks = [];
            this.comments = [];
            this.newComment = '';
            this.subtaskForm.newSubtaskTitle = '';
            this.subtaskInputError = false;
            this.commentInputError = false;
            this.editingCommentId = null;
            
            if (this.subtaskSortable) {
                this.subtaskSortable.destroy();
                this.subtaskSortable = null;
            }
        },
        
        async addNewSubtask() {
            if (!this.subtaskForm.newSubtaskTitle.trim()) {
                this.subtaskInputError = true;
                return;
            }
            
            this.subtaskInputError = false;
            
            try {
                const data = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks`,
                    {
                        method: 'POST',
                        body: {
                            title: this.subtaskForm.newSubtaskTitle,
                            is_completed: false
                        }
                    }
                );
                if (data.ok) {
                    this.subtasks.push(data.subtask);
                    this.subtaskForm.newSubtaskTitle = '';
                    this.renderSubtasks();
                    this.initSubtaskSortable();
                    this.showToast('Subtask added');
                    this.updateTaskProgress();
                }
            } catch (err) {
                console.error('Error adding subtask:', err);
            }
        },
        
        async removeSubtask(subtaskId) {
            if (!confirm('Delete this subtask?')) return;
            
            try {
                const data = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks/${subtaskId}`,
                    { method: 'DELETE' }
                );
                if (data.ok) {
                    this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
                    this.renderSubtasks();
                    this.initSubtaskSortable();
                    this.showToast('Subtask removed');
                    this.updateTaskProgress();
                }
            } catch (err) {
                console.error('Error removing subtask:', err);
            }
        },
        
        async toggleSubtaskCompletion(subtaskIndex) {
            const subtask = this.subtasks[subtaskIndex];
            if (!subtask) return;
            
            try {
                const data = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks/${subtask.id}/toggle`,
                    { method: 'POST' }
                );
                if (data.ok) {
                    this.subtasks[subtaskIndex].is_completed = data.subtask.is_completed;
                    this.renderSubtasks();
                    this.initSubtaskSortable();
                    this.updateTaskProgress();
                }
            } catch (err) {
                console.error('Error toggling subtask:', err);
            }
        },
        
        async _reorderSubtasks() {
            if (!this.currentTaskForSubtasks || !this.currentTaskForSubtasks.id) {
                console.error('No current task for subtasks or missing task ID');
                return;
            }
            
            try {
                const data = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks/reorder`,
                    {
                        method: 'POST',
                        body: {
                            subtasks: this.subtasks.map(s => ({ id: s.id, order: s.order }))
                        }
                    }
                );
                
                if (data.ok) {
                    this.showToast('Subtasks reordered');
                }
            } catch (err) {
                console.error('Error reordering subtasks:', err);
            }
        },
        
        getSubtaskProgress() {
            if (this.subtasks.length === 0) return 0;
            const completed = this.subtasks.filter(s => s.is_completed).length;
            return Math.round((completed / this.subtasks.length) * 100);
        },
        
        async updateTaskProgress() {
            if (!this.currentTaskForSubtasks) return;
            
            const progress = this.getSubtaskProgress();
            
            try {
                const data = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}`,
                    {
                        method: 'POST',
                        body: {
                            progress: progress,
                            alt_progress: progress
                        }
                    }
                );
                if (data.ok) {
                    this._updateTaskProgressInUI(this.currentTaskForSubtasks.id, progress);
                }
            } catch (err) {
                console.error('Error updating task progress:', err);
            }
        },
        
        _updateTaskProgressInUI(taskId, progress) {
            this.sections.forEach(section => {
                const taskIndex = section.task_items.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    section.task_items[taskIndex].progress = progress;
                    section.task_items[taskIndex].alt_progress = progress;
                    section.task_items[taskIndex].subtasks = this.subtasks;
                }
            });
            
            if (this.currentTaskForSubtasks) {
                this.currentTaskForSubtasks.progress = progress;
                this.currentTaskForSubtasks.subtasks = this.subtasks;
            }
        },
        
        // Utility methods
        _focusElement(selector, value = null) {
            requestAnimationFrame(() => {
                const elements = document.querySelectorAll(selector);
                const target = value 
                    ? Array.from(elements).find(el => el.value === value)
                    : elements[elements.length - 1];
                
                if (target) {
                    target.focus();
                    target.select();
                }
            });
        },
        
        showToast(message) {
            // Remove existing toasts
            document.querySelectorAll('.toast-message').forEach(toast => toast.remove());
            
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 toast-message';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.remove(), 2500);
        },
        
        // Comment methods
        async loadComments(taskId) {
            if (!taskId) return;
            
            const res = await this._fetch(`/tasks/${this.projectId}/items/${taskId}/comments`, {
                method: 'GET'
            });
            
            if (res.ok) {
                this.comments = res.comments || [];
                this.renderComments();
            }
        },
        
        renderComments() {
            const container = document.getElementById('comments-container');
            const emptyState = document.getElementById('comments-empty');
            
            if (!container || !emptyState) return;
            
            container.innerHTML = '';
            
            if (this.comments.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            this.comments.forEach(comment => {
                const div = document.createElement('div');
                div.className = 'bg-gray-50 rounded-lg p-4';
                div.setAttribute('data-comment-id', comment.id);
                
                const isEditing = this.editingCommentId === comment.id;
                
                div.innerHTML = `
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                ${this._escapeHtml((comment.user?.name || 'U')[0].toUpperCase())}
                            </div>
                            <div>
                                <p class="font-semibold text-gray-800">${this._escapeHtml(comment.user?.name || 'Unknown')}</p>
                                <p class="text-xs text-gray-500">${this._formatDate(comment.created_at)}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="taskManager().startEditComment(${comment.id})" 
                                    class="text-indigo-600 hover:text-indigo-700 text-sm px-2 py-1"
                                    title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="taskManager().deleteComment(${comment.id})" 
                                    class="text-red-600 hover:text-red-700 text-sm px-2 py-1"
                                    title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${isEditing ? `
                        <textarea 
                            id="edit-comment-${comment.id}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                            rows="3">${this._escapeHtml(comment.comment)}</textarea>
                        <div class="flex gap-2 justify-end">
                            <button onclick="taskManager().saveEditComment(${comment.id})" 
                                    class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                                Save
                            </button>
                            <button onclick="taskManager().cancelEditComment()" 
                                    class="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm">
                                Cancel
                            </button>
                        </div>
                    ` : `
                        <p class="text-gray-700 whitespace-pre-wrap">${this._escapeHtml(comment.comment)}</p>
                    `}
                `;
                
                container.appendChild(div);
            });
        },
        
        async postComment() {
            const comment = this.newComment.trim();
            
            if (!comment) {
                this.commentInputError = true;
                setTimeout(() => this.commentInputError = false, 2000);
                return;
            }
            
            if (!this.currentTaskForSubtasks) return;
            
            console.log('Posting comment:', { comment, taskId: this.currentTaskForSubtasks.id, projectId: this.projectId });
            
            const res = await this._fetch(`/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/comments`, {
                method: 'POST',
                body: { comment }
            });
            
            console.log('Comment response:', res);
            
            if (res.ok) {
                this.newComment = '';
                this.commentInputError = false;
                await this.loadComments(this.currentTaskForSubtasks.id);
                this.showToast('Comment posted successfully');
            } else {
                // Handle specific error cases
                if (res.status === 422) {
                    console.error('Validation error:', res.errors || res);
                    this.showToast('Validation error: Please check your input');
                } else if (res.status === 401 || res.status === 403) {
                    console.error('Authentication error:', res);
                    this.showToast('Authentication required. Please log in.');
                    // Optionally redirect to login after a delay
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    console.error('Comment post error:', res);
                    this.showToast(res.message || 'Failed to post comment');
                }
            }
        },
        
        startEditComment(commentId) {
            this.editingCommentId = commentId;
            this.renderComments();
        },
        
        async saveEditComment(commentId) {
            const textarea = document.getElementById(`edit-comment-${commentId}`);
            if (!textarea) return;
            
            const comment = textarea.value.trim();
            if (!comment) {
                this.showToast('Comment cannot be empty');
                return;
            }
            
            const res = await this._fetch(`/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/comments/${commentId}`, {
                method: 'PUT',
                body: { comment }
            });
            
            if (res.ok) {
                this.editingCommentId = null;
                await this.loadComments(this.currentTaskForSubtasks.id);
                this.showToast('Comment updated successfully');
            } else {
                this.showToast(res.message || 'Failed to update comment');
            }
        },
        
        cancelEditComment() {
            this.editingCommentId = null;
            this.renderComments();
        },
        
        async deleteComment(commentId) {
            if (!confirm('Are you sure you want to delete this comment?')) return;
            
            const res = await this._fetch(`/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/comments/${commentId}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                await this.loadComments(this.currentTaskForSubtasks.id);
                this.showToast('Comment deleted successfully');
            } else {
                this.showToast(res.message || 'Failed to delete comment');
            }
        },
        
        _formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        },
        
        // Trash Modal Methods
        async confirmTrashTask() {
            await this.loadTrashedItems();
            this.showTrashModal = true;
        },
        
        async loadTrashedItems() {
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/trash`);
                if (data.ok) {
                    this.trashedSections = data.sections || [];
                    this.trashedTasks = data.tasks || [];
                }
            } catch (err) {
                console.error('Error loading trashed items:', err);
                this.showToast('Failed to load trash');
            }
        },
        
        closeTrashModal() {
            this.showTrashModal = false;
            this.trashedSections = [];
            this.trashedTasks = [];
        },
        
        // Delete Modal Methods
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.deleteModal = {
                type: '',
                id: null,
                title: '',
                taskCount: 0,
                subtaskCount: 0
            };
        },
        
        async confirmDelete() {
            if (this.deleteModal.type === 'section') {
                await this.executeDeleteSection(this.deleteModal.id);
            } else if (this.deleteModal.type === 'task') {
                await this.executeDeleteTask(this.deleteModal.id);
            }
            this.closeDeleteModal();
        },
        
        async restoreSection(sectionId) {
            if (!confirm('Restore this section and all its task cards?')) return;
            
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/sections/${sectionId}/restore`, {
                    method: 'POST'
                });
                
                if (data.ok) {
                    this.showToast('Section restored successfully');
                    await this.loadTrashedItems();
                    await this.loadSections();
                } else {
                    this.showToast(data.message || 'Failed to restore section');
                }
            } catch (err) {
                console.error('Error restoring section:', err);
                this.showToast('Failed to restore section');
            }
        },
        
        async restoreTask(taskId) {
            if (!confirm('Restore this task card?')) return;
            
            try {
                const data = await this._fetch(`/tasks/${this.projectId}/items/${taskId}/restore`, {
                    method: 'POST'
                });
                
                if (data.ok) {
                    this.showToast('Task restored successfully');
                    await this.loadTrashedItems();
                    await this.loadSections();
                } else {
                    this.showToast(data.message || 'Failed to restore task');
                }
            } catch (err) {
                console.error('Error restoring task:', err);
                this.showToast('Failed to restore task');
            }
        },
        
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        // Legacy methods for compatibility (minimal changes)
        showInviteModal() {
            this.showToast('Invite feature coming soon');
        },
        
        updateTaskInList() {
            this.loadSections();
        }
    };
    
    return taskManager_instance;
}