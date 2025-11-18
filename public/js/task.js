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
        currentTaskForSubtasks: null,
        
        sections: [],
        subtasks: [],
        
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
                const response = await this._fetch(`/tasks/${this.projectId}/sections`);
                if (response.ok) {
                    const data = await response.json();
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
            const config = {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this._cache.csrfToken,
                    ...options.headers
                },
                ...options
            };
            
            if (config.body && typeof config.body !== 'string') {
                config.headers['Content-Type'] = 'application/json';
                config.body = JSON.stringify(config.body);
            }
            
            return fetch(url, config);
        },
        
        async _updateTaskSection(taskId, sectionId, order) {
            const response = await this._fetch(`/tasks/${this.projectId}/items/${taskId}`, {
                method: 'POST',
                body: { task_section_id: sectionId, order }
            });
            
            const data = await response.json();
            if (!data.ok) throw new Error('Failed to move task');
            return data;
        },
        
        async _reorderTasksInBackend(sectionId, tasks) {
            const response = await this._fetch(`/tasks/${this.projectId}/sections/${sectionId}/reorder-items`, {
                method: 'POST',
                body: { items: tasks }
            });
            
            const data = await response.json();
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
            const response = await this._fetch(`/tasks/${this.projectId}/sections`, {
                method: 'POST',
                body: { title }
            });
            
            const data = await response.json();
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
            const response = await this._fetch(`/tasks/${this.projectId}/sections/${section.id}`, {
                method: 'POST',
                body: { title }
            });
            
            const data = await response.json();
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
        
        async deleteSection(sectionId) {
            if (!confirm('Delete this section and all its tasks?')) return;
            
            try {
                const response = await this._fetch(`/tasks/${this.projectId}/sections/${sectionId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
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
                const response = await this._fetch(endpoint, {
                    method: 'POST',
                    body: payload
                });
                
                const data = await response.json();
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
        
        async deleteTask(taskId) {
            if (!confirm('Delete this task?')) return;
            
            try {
                const response = await this._fetch(`/tasks/${this.projectId}/items/${taskId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
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
                const response = await this._fetch(`/tasks/${this.projectId}/items/${task.id}`, {
                    method: 'POST',
                    body: { title: trimmedTitle }
                });
                
                const data = await response.json();
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
            this.showSubtaskModal = true;
            this.loadSubtasks(task.id);
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
            
            // Update array immediately for responsive UI
            const reorderedSubtasks = [...this.subtasks];
            const [movedItem] = reorderedSubtasks.splice(oldIndex, 1);
            reorderedSubtasks.splice(newIndex, 0, movedItem);
            
            // Update order and save
            this.subtasks = reorderedSubtasks.map((subtask, index) => ({
                ...subtask,
                order: index + 1
            }));
            
            await this._reorderSubtasks();
        },
        
        async loadSubtasks(taskId) {
            try {
                const response = await this._fetch(`/tasks/${this.projectId}/items/${taskId}/subtasks`);
                const data = await response.json();
                if (data.ok) {
                    this.subtasks = data.subtasks || [];
                    requestAnimationFrame(() => this.initSubtaskSortable());
                }
            } catch (err) {
                console.error('Error loading subtasks:', err);
            }
        },
        
        closeSubtaskModal() {
            this.showSubtaskModal = false;
            this.currentTaskForSubtasks = null;
            this.subtasks = [];
            this.subtaskForm.newSubtaskTitle = '';
            
            if (this.subtaskSortable) {
                this.subtaskSortable.destroy();
                this.subtaskSortable = null;
            }
        },
        
        async addNewSubtask() {
            if (!this.subtaskForm.newSubtaskTitle.trim()) {
                this.showToast('Subtask title cannot be empty');
                return;
            }
            
            try {
                const response = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks`,
                    {
                        method: 'POST',
                        body: {
                            title: this.subtaskForm.newSubtaskTitle,
                            is_completed: false
                        }
                    }
                );
                
                const data = await response.json();
                if (data.ok) {
                    this.subtasks.push(data.subtask);
                    this.subtaskForm.newSubtaskTitle = '';
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
                const response = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks/${subtaskId}`,
                    { method: 'DELETE' }
                );
                
                const data = await response.json();
                if (data.ok) {
                    this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
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
                const response = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks/${subtask.id}/toggle`,
                    { method: 'POST' }
                );
                
                const data = await response.json();
                if (data.ok) {
                    this.subtasks[subtaskIndex].is_completed = data.subtask.is_completed;
                    this.updateTaskProgress();
                }
            } catch (err) {
                console.error('Error toggling subtask:', err);
            }
        },
        
        async _reorderSubtasks() {
            try {
                const response = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}/subtasks/reorder`,
                    {
                        method: 'POST',
                        body: {
                            subtasks: this.subtasks.map(s => ({ id: s.id, order: s.order }))
                        }
                    }
                );
                
                const data = await response.json();
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
                const response = await this._fetch(
                    `/tasks/${this.projectId}/items/${this.currentTaskForSubtasks.id}`,
                    {
                        method: 'POST',
                        body: {
                            progress: progress,
                            alt_progress: progress
                        }
                    }
                );
                
                const data = await response.json();
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
        
        // Legacy methods for compatibility (minimal changes)
        confirmTrashTask() {
            this.showToast('Trash functionality coming soon');
        },
        
        showInviteModal() {
            this.showToast('Invite feature coming soon');
        },
        
        updateTaskInList() {
            this.loadSections();
        }
    };
    
    return taskManager_instance;
}