let taskManager_instance = null;

function taskManager() {
    taskManager_instance = {
        projectId: document.querySelector('[data-project-id]').getAttribute('data-project-id'),
        draggedTask: null,
        draggedFrom: null,
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
            date: '0%',
            subtasks: '0/0'
        },
        
        subtaskForm: {
            newSubtaskTitle: ''
        },
        
        init() {
            console.log('taskManager initialized!');
            console.log('Project ID:', this.projectId);
            this.loadSections();
        },
        
        loadSections() {
            const projectId = this.projectId;
            fetch(`/tasks/${projectId}/sections`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.sections = data.sections.map(section => ({
                        ...section,
                        editing: false,
                        originalTitle: section.title
                    }));
                }
            })
            .catch(err => console.error('Error loading sections:', err));
        },
        
        dragStart(event, taskId, column) {
            this.draggedTask = taskId;
            this.draggedFrom = column;
            event.dataTransfer.effectAllowed = 'move';
            event.currentTarget.classList.add('opacity-50');
        },
        
        dragEnd(event) {
            event.currentTarget.classList.remove('opacity-50');
        },
        
        allowDrop(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        
        drop(event, targetColumn) {
            event.preventDefault();
            event.currentTarget.classList.remove('bg-gray-100');
            
            const taskId = this.draggedTask;
            const sourceColumn = this.draggedFrom;
            
            if (sourceColumn !== targetColumn && taskId) {
                // Find task in source column
                const taskIndex = this.tasks[sourceColumn].findIndex(t => t.id == taskId);
                if (taskIndex !== -1) {
                    // Move task
                    const [task] = this.tasks[sourceColumn].splice(taskIndex, 1);
                    task.column = targetColumn;
                    this.tasks[targetColumn].push(task);
                    
                    // Update in DB
                    this.updateTaskColumn(taskId, targetColumn);
                }
            }
            
            this.draggedTask = null;
            this.draggedFrom = null;
        },
        
        updateTaskColumn(taskId, newColumn) {
            const projectId = this.projectId;
            fetch(`/tasks/${projectId}/items/${taskId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ column: newColumn })
            })
            .catch(err => console.error('Error updating task column:', err));
        },
        
        
        showAddModal(column) {
            this.editingTask = null;
            this.selectedColumn = column;
            this.modalForm = { title: '', description: '', progress: 0, date: '0%', subtasks: '0/0' };
            this.showModal = true;
        },
        
        editTask(task) {
            this.editingTask = task;
            this.selectedColumn = task.column;
            this.modalForm = {
                title: task.title,
                description: task.description || '',
                progress: task.progress,
                date: task.date,
                subtasks: task.subtasks
            };
            this.showModal = true;
        },
        
        saveTask() {
            if (!this.modalForm.title.trim()) {
                alert('Task title is required');
                return;
            }
            
            const projectId = this.projectId;
            const isEdit = !!this.editingTask;
            const endpoint = isEdit 
                ? `/tasks/${projectId}/items/${this.editingTask.id}`
                : `/tasks/${projectId}/items`;
            const method = isEdit ? 'POST' : 'POST';
            
            // Use 'eicaer' as default column if no valid column is selected
            let columnToUse = this.selectedColumn;
            if (columnToUse === 'default' || !columnToUse) {
                columnToUse = 'eicaer';
            }
            
            const payload = {
                title: this.modalForm.title,
                description: this.modalForm.description || '',
                column: columnToUse,
                progress: parseInt(this.modalForm.progress) || 0,
                alt_progress: parseInt(this.modalForm.progress) || 0,
                subtasks: this.modalForm.subtasks,
                date: this.modalForm.date || '0%'
            };
            
            console.log('Saving task:', { endpoint, payload, columnToUse });
            
            fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(payload)
            })
            .then(r => {
                console.log('Response status:', r.status);
                return r.json();
            })
            .then(data => {
                console.log('Response data:', data);
                if (data.ok) {
                    if (isEdit) {
                        // Update existing task in array
                        const column = this.editingTask.column;
                        const index = this.tasks[column].findIndex(t => t.id === this.editingTask.id);
                        if (index !== -1) {
                            this.tasks[column][index] = data.item;
                        }
                    } else {
                        // Add new task to the correct column
                        console.log('Adding task to column:', columnToUse);
                        console.log('Tasks before:', JSON.parse(JSON.stringify(this.tasks)));
                        this.tasks[columnToUse].push(data.item);
                        console.log('Tasks after:', JSON.parse(JSON.stringify(this.tasks)));
                    }
                    this.closeModal();
                    this.showToast('Task ' + (isEdit ? 'updated' : 'created') + ' successfully!');
                } else {
                    console.error('Error response:', data);
                    alert('Error: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(err => {
                console.error('Error saving task:', err);
                alert('Error saving task: ' + err.message);
            });
        },
        
        closeModal() {
            this.showModal = false;
            this.editingTask = null;
            this.modalForm = { title: '', description: '', progress: 0, date: '0%', subtasks: '0/0' };
        },
        
        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        },
        
        addTask(event) {
            // Legacy method - use saveTask() from modal instead
            // This method is kept for backwards compatibility but not used with Alpine modal
        },
        
        deleteTask(taskId) {
            if (!confirm('Are you sure you want to delete this task?')) return;
            
            // Find and remove from tasks
            for (const column in this.tasks) {
                const index = this.tasks[column].findIndex(t => t.id == taskId);
                if (index !== -1) {
                    this.tasks[column].splice(index, 1);
                    break;
                }
            }
            
            // Delete from DB
            const projectId = this.projectId;
            fetch(`/tasks/${projectId}/items/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .catch(err => console.error('Error deleting task:', err));
        },

        confirmTrashTask() {
            // Collect all current tasks for trashing
            let tasksToTrash = [];
            
            // Collect all tasks
            Object.keys(this.tasks).forEach(column => {
                this.tasks[column].forEach(task => {
                    tasksToTrash.push(task.id);
                });
            });

            if (tasksToTrash.length === 0) {
                this.showToast('No tasks to trash');
                return;
            }

            if (confirm(`Are you sure you want to trash ${tasksToTrash.length} task(s)? You can recover them later.`)) {
                tasksToTrash.forEach(taskId => this.trashTask(taskId));
                this.showToast('Tasks moved to trash');
            }
        },

        trashTask(taskId) {
            // Find and remove from tasks
            for (const column in this.tasks) {
                const index = this.tasks[column].findIndex(t => t.id == taskId);
                if (index !== -1) {
                    this.tasks[column].splice(index, 1);
                    
                    // Send soft delete to server
                    const projectId = this.projectId;
                    fetch(`/tasks/${projectId}/items/${taskId}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    })
                    .catch(err => console.error('Error trashing task:', err));
                    break;
                }
            }
        },

        showInviteModal() {
            this.showToast('Invite feature coming soon!');
            // Placeholder for future invite functionality
            // You can expand this to show a modal for inviting team members
        },

        // Subtask Management Methods
        openSubtaskModal(task) {
            this.currentTaskForSubtasks = task;
            this.subtaskForm.newSubtaskTitle = '';
            this.showSubtaskModal = true;
            
            // Load subtasks from database
            this.loadSubtasks(task.id);
        },

        loadSubtasks(taskId) {
            const projectId = this.projectId;
            fetch(`/tasks/${projectId}/items/${taskId}/subtasks`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.subtasks = data.subtasks || [];
                }
            })
            .catch(err => console.error('Error loading subtasks:', err));
        },

        closeSubtaskModal() {
            this.showSubtaskModal = false;
            this.currentTaskForSubtasks = null;
            this.subtasks = [];
            this.subtaskForm.newSubtaskTitle = '';
        },

        addNewSubtask() {
            if (!this.subtaskForm.newSubtaskTitle.trim()) {
                this.showToast('Subtask title cannot be empty');
                return;
            }

            const projectId = this.projectId;
            const taskId = this.currentTaskForSubtasks.id;

            fetch(`/tasks/${projectId}/items/${taskId}/subtasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    title: this.subtaskForm.newSubtaskTitle,
                    is_completed: false
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.subtasks.push(data.subtask);
                    this.subtaskForm.newSubtaskTitle = '';
                    this.showToast('Subtask added successfully');
                    this.updateTaskInList();
                }
            })
            .catch(err => console.error('Error adding subtask:', err));
        },

        removeSubtask(subtaskId) {
            if (!confirm('Are you sure you want to delete this subtask?')) return;

            const projectId = this.projectId;
            const taskId = this.currentTaskForSubtasks.id;

            fetch(`/tasks/${projectId}/items/${taskId}/subtasks/${subtaskId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
                    this.showToast('Subtask removed successfully');
                    this.updateTaskInList();
                }
            })
            .catch(err => console.error('Error removing subtask:', err));
        },

        toggleSubtaskCompletion(subtaskIndex) {
            if (!this.subtasks[subtaskIndex]) return;

            const subtask = this.subtasks[subtaskIndex];
            const projectId = this.projectId;
            const taskId = this.currentTaskForSubtasks.id;

            fetch(`/tasks/${projectId}/items/${taskId}/subtasks/${subtask.id}/toggle`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.subtasks[subtaskIndex].is_completed = data.subtask.is_completed;
                    this.updateTaskInList();
                }
            })
            .catch(err => console.error('Error toggling subtask:', err));
        },

        moveSubtaskUp(subtaskIndex) {
            if (subtaskIndex > 0) {
                [this.subtasks[subtaskIndex - 1], this.subtasks[subtaskIndex]] = 
                [this.subtasks[subtaskIndex], this.subtasks[subtaskIndex - 1]];
                this.reorderSubtasks();
            }
        },

        moveSubtaskDown(subtaskIndex) {
            if (subtaskIndex < this.subtasks.length - 1) {
                [this.subtasks[subtaskIndex + 1], this.subtasks[subtaskIndex]] = 
                [this.subtasks[subtaskIndex], this.subtasks[subtaskIndex + 1]];
                this.reorderSubtasks();
            }
        },

        reorderSubtasks() {
            const projectId = this.projectId;
            const taskId = this.currentTaskForSubtasks.id;

            // Update order in array
            this.subtasks.forEach((subtask, index) => {
                subtask.order = index + 1;
            });

            // Send to API
            fetch(`/tasks/${projectId}/items/${taskId}/subtasks/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    subtasks: this.subtasks.map(s => ({ id: s.id, order: s.order }))
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.showToast('Subtasks reordered successfully');
                }
            })
            .catch(err => console.error('Error reordering subtasks:', err));
        },

        getSubtaskProgress() {
            if (this.subtasks.length === 0) return 0;
            const completed = this.subtasks.filter(s => s.is_completed).length;
            return Math.round((completed / this.subtasks.length) * 100);
        },

        updateTaskInList() {
            // Reload tasks to get updated subtask counts
            this.loadTasks();
        }
    };
    
    return taskManager_instance;
}
