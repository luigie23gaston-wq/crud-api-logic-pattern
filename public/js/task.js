let taskManager_instance = null;

function taskManager() {
    taskManager_instance = {
        projectId: document.querySelector('[data-project-id]').getAttribute('data-project-id'),
        draggedTask: null,
        draggedFrom: null,
        draggedSection: null,
        draggedSubtaskIndex: null,
        subtaskSortable: null,
        taskSortables: [],  // Track task card sortable instances
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
        
        init() {
            console.log('taskManager initialized!');
            console.log('Project ID:', this.projectId);
            this.loadSections();
        },
        
        initTaskCardSortables() {
            console.log('🎯 Initializing task card sortables for all sections');
            const self = this;
            
            // Wait for Alpine to finish rendering
            this.$nextTick(() => {
                // Destroy any existing sortables first
                if (this.taskSortables) {
                    this.taskSortables.forEach(s => s.destroy());
                }
                this.taskSortables = [];
                
                // Initialize Sortable for each section's task container
                document.querySelectorAll('.section-tasks').forEach((container, index) => {
                    if (!self.sections[index]) return;
                    
                    const sortable = Sortable.create(container, {
                        group: 'tasks',
                        animation: 200,
                        ghostClass: 'task-card-ghost',
                        chosenClass: 'task-card-chosen',
                        dragClass: 'task-card-dragging',
                        forceFallback: false,
                        onEnd: function(evt) {
                            console.log('📋 Task card drag ended');
                            
                            // Get section indexes from DOM
                            const fromSectionEl = evt.from.closest('.task-section');
                            const toSectionEl = evt.to.closest('.task-section');
                            
                            const fromIndex = parseInt(fromSectionEl?.dataset.sectionIndex);
                            const toIndex = parseInt(toSectionEl?.dataset.sectionIndex);
                            
                            if (isNaN(fromIndex) || isNaN(toIndex)) {
                                console.error('Invalid section indexes');
                                return;
                            }
                            
                            const fromSection = self.sections[fromIndex];
                            const toSection = self.sections[toIndex];
                            
                            if (!fromSection || !toSection) {
                                console.error('Sections not found');
                                return;
                            }
                            
                            const oldIndex = evt.oldIndex;
                            const newIndex = evt.newIndex;
                            
                            // Update Alpine's data
                            const movedTask = fromSection.task_items[oldIndex];
                            
                            // Remove from source
                            fromSection.task_items.splice(oldIndex, 1);
                            
                            // Add to target
                            toSection.task_items.splice(newIndex, 0, movedTask);
                            
                            // Force Alpine to update
                            self.sections = [...self.sections];
                            
                            // Update backend if moved to different section
                            if (fromIndex !== toIndex) {
                                self.moveTaskToSection(movedTask.id, toSection.id);
                            } else {
                                self.showToast('Task reordered');
                            }
                        }
                    });
                    
                    self.taskSortables.push(sortable);
                });
                
                console.log('✅ Task card sortables initialized:', self.taskSortables.length);
            });
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
                        originalTitle: section.title,
                        task_items: (section.task_items || []).map(task => ({
                            ...task,
                            // Ensure subtasks is always an array
                            subtasks: Array.isArray(task.subtasks) 
                                ? task.subtasks 
                                : (typeof task.subtasks === 'string' && task.subtasks 
                                    ? JSON.parse(task.subtasks) 
                                    : [])
                        }))
                    }));
                    
                    // Initialize task card sortables after sections render
                    setTimeout(() => {
                        this.initTaskCardSortables();
                    }, 300);
                }
            })
            .catch(err => console.error('Error loading sections:', err));
        },
        
        // Drag and Drop Methods
        dragStart(event, task, sectionId) {
            this.draggedTask = task;
            this.draggedFrom = sectionId;
            event.dataTransfer.effectAllowed = 'move';
            event.currentTarget.classList.add('opacity-50');
        },
        
        dragEnd(event) {
            event.currentTarget.classList.remove('opacity-50');
            this.draggedTask = null;
            this.draggedFrom = null;
        },
        
        allowDrop(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        
        dragEnter(event) {
            event.preventDefault();
            if (event.currentTarget.classList.contains('section-tasks')) {
                event.currentTarget.classList.add('drag-over');
            }
        },
        
        dragLeave(event) {
            if (event.currentTarget.classList.contains('section-tasks')) {
                event.currentTarget.classList.remove('drag-over');
            }
        },
        
        drop(event, targetSectionId) {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');
            
            if (!this.draggedTask || !this.draggedFrom) return;
            
            const sourceSectionId = this.draggedFrom;
            
            // If dropped in the same section, do nothing
            if (sourceSectionId === targetSectionId) {
                return;
            }
            
            // Find source and target sections
            const sourceSection = this.sections.find(s => s.id === sourceSectionId);
            const targetSection = this.sections.find(s => s.id === targetSectionId);
            
            if (!sourceSection || !targetSection) return;
            
            // Remove task from source section
            const taskIndex = sourceSection.task_items.findIndex(t => t.id === this.draggedTask.id);
            if (taskIndex === -1) return;
            
            const [movedTask] = sourceSection.task_items.splice(taskIndex, 1);
            
            // Add task to target section
            targetSection.task_items.push(movedTask);
            
            // Update task's section in backend
            this.moveTaskToSection(movedTask.id, targetSectionId);
        },
        
        moveTaskToSection(taskId, newSectionId) {
            const projectId = this.projectId;
            fetch(`/tasks/${projectId}/items/${taskId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    task_section_id: newSectionId
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.showToast('Task moved successfully');
                } else {
                    // Reload sections if update failed
                    this.loadSections();
                }
            })
            .catch(err => {
                console.error('Error moving task:', err);
                this.loadSections();
            });
        },
        
        // Section Drag and Drop Methods
        sectionDragStart(event, section) {
            this.draggedSection = section;
            event.dataTransfer.effectAllowed = 'move';
            event.currentTarget.style.cursor = 'grabbing';
            const sectionEl = event.currentTarget.closest('.task-section');
            if (sectionEl) {
                sectionEl.style.opacity = '0.5';
            }
        },
        
        sectionDragEnd(event) {
            event.currentTarget.style.cursor = 'grab';
            const sectionEl = event.currentTarget.closest('.task-section');
            if (sectionEl) {
                sectionEl.style.opacity = '1';
            }
            this.draggedSection = null;
            // Remove all drop zone indicators
            document.querySelectorAll('.task-section').forEach(el => {
                el.classList.remove('section-drop-zone');
            });
        },
        
        sectionAllowDrop(event) {
            if (!this.draggedSection) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        
        sectionDragEnter(event) {
            if (!this.draggedSection) return;
            event.preventDefault();
            const target = event.currentTarget;
            if (target && target.classList.contains('task-section')) {
                target.classList.add('section-drop-zone');
            }
        },
        
        sectionDragLeave(event) {
            if (!this.draggedSection) return;
            const target = event.currentTarget;
            if (target && target.classList.contains('task-section')) {
                target.classList.remove('section-drop-zone');
            }
        },
        
        sectionDrop(event, targetSection) {
            event.preventDefault();
            
            if (!this.draggedSection || this.draggedSection.id === targetSection.id) return;
            
            const draggedIndex = this.sections.findIndex(s => s.id === this.draggedSection.id);
            const targetIndex = this.sections.findIndex(s => s.id === targetSection.id);
            
            if (draggedIndex === -1 || targetIndex === -1) return;
            
            // Remove from old position
            const [movedSection] = this.sections.splice(draggedIndex, 1);
            
            // Insert at new position
            this.sections.splice(targetIndex, 0, movedSection);
            
            // Update order values
            this.sections.forEach((section, index) => {
                section.order = index + 1;
            });
            
            // Save new order to backend
            this.saveSectionOrder();
        },
        
        saveSectionOrder() {
            const projectId = this.projectId;
            const orderData = this.sections.map((section, index) => ({
                id: section.id,
                order: index + 1
            }));
            
            fetch(`/tasks/${projectId}/sections/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ sections: orderData })
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.showToast('Section order updated');
                } else {
                    this.loadSections();
                }
            })
            .catch(err => {
                console.error('Error updating section order:', err);
                this.loadSections();
            });
        },
        
        // Section Management
        showAddSectionModal() {
            // Create a temporary section with empty title and editing mode enabled
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
            
            // Focus the input after Alpine renders it
            this.$nextTick(() => {
                const inputs = document.querySelectorAll('.section-title-input');
                const lastInput = inputs[inputs.length - 1];
                if (lastInput) lastInput.focus();
            });
        },
        
        editSectionTitle(section) {
            section.editing = true;
            section.originalTitle = section.title;
            setTimeout(() => {
                const inputs = document.querySelectorAll('.section-title-input');
                inputs.forEach(input => {
                    if (input.value === section.title) {
                        input.focus();
                        input.select();
                    }
                });
            }, 50);
        },
        
        saveSectionTitle(section) {
            const trimmedTitle = section.title.trim();
            
            // If it's a new section and no title provided, remove it
            if (section.isNew && !trimmedTitle) {
                this.sections = this.sections.filter(s => s.id !== section.id);
                return;
            }
            
            // If it's an existing section and no title provided, restore original
            if (!section.isNew && !trimmedTitle) {
                section.title = section.originalTitle;
                section.editing = false;
                return;
            }
            
            // If it's a new section with title, create it in database
            if (section.isNew) {
                const projectId = this.projectId;
                fetch(`/tasks/${projectId}/sections`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({ title: trimmedTitle })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.ok) {
                        // Replace temp section with real one from server
                        const index = this.sections.findIndex(s => s.id === section.id);
                        if (index !== -1) {
                            this.sections[index] = {
                                ...data.section,
                                task_items: [],
                                editing: false,
                                originalTitle: data.section.title
                            };
                        }
                        this.showToast('Section created');
                    }
                })
                .catch(err => {
                    console.error('Error creating section:', err);
                    this.sections = this.sections.filter(s => s.id !== section.id);
                    this.showToast('Error creating section');
                });
            } else {
                // Update existing section
                const projectId = this.projectId;
                fetch(`/tasks/${projectId}/sections/${section.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({ title: trimmedTitle })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.ok) {
                        section.editing = false;
                        section.originalTitle = trimmedTitle;
                        section.title = trimmedTitle;
                        this.showToast('Section updated');
                    }
                })
                .catch(err => {
                    console.error('Error updating section:', err);
                    section.title = section.originalTitle;
                    section.editing = false;
                });
            }
        },
        
        cancelSectionEdit(section) {
            // If it's a new section being cancelled, remove it
            if (section.isNew) {
                this.sections = this.sections.filter(s => s.id !== section.id);
            } else {
                // If editing existing section, restore original title
                section.title = section.originalTitle;
                section.editing = false;
            }
        },
        
        deleteSection(sectionId) {
            if (!confirm('Delete this section and all its tasks?')) return;
            
            const projectId = this.projectId;
            fetch(`/tasks/${projectId}/sections/${sectionId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    this.sections = this.sections.filter(s => s.id !== sectionId);
                    this.showToast('Section deleted');
                }
            })
            .catch(err => console.error('Error deleting section:', err));
        },
        
        // Task Management
        showAddTaskModal(section) {
            this.editingTask = null;
            this.selectedSection = section;
            this.modalForm = { title: '', description: '', progress: 0, date: '', subtasks: '0/0' };
            this.showModal = true;
        },
        
        editTask(task) {
            this.editingTask = task;
            const section = this.sections.find(s => s.task_items.some(t => t.id === task.id));
            this.selectedSection = section;
            this.modalForm = {
                title: task.title,
                description: task.description || '',
                progress: task.progress,
                date: task.date || '',
                subtasks: task.subtasks
            };
            this.showModal = true;
        },
        
        saveTask() {
            if (!this.modalForm.title.trim()) {
                alert('Task title is required');
                return;
            }
            
            if (!this.selectedSection) {
                alert('Please select a section');
                return;
            }
            
            const projectId = this.projectId;
            const isEdit = !!this.editingTask;
            const endpoint = isEdit 
                ? `/tasks/${projectId}/items/${this.editingTask.id}`
                : `/tasks/${projectId}/items`;
            
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
            
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    if (isEdit) {
                        // Update existing task
                        const section = this.sections.find(s => s.id === this.selectedSection.id);
                        if (section) {
                            const index = section.task_items.findIndex(t => t.id === this.editingTask.id);
                            if (index !== -1) {
                                section.task_items[index] = data.item;
                            }
                        }
                    } else {
                        // Add new task to section
                        const section = this.sections.find(s => s.id === this.selectedSection.id);
                        if (section) {
                            if (!section.task_items) section.task_items = [];
                            section.task_items.push(data.item);
                        }
                    }
                    this.closeModal();
                    this.showToast('Task ' + (isEdit ? 'updated' : 'created') + ' successfully!');
                }
            })
            .catch(err => {
                console.error('Error saving task:', err);
                alert('Error saving task');
            });
        },
        
        closeModal() {
            this.showModal = false;
            this.editingTask = null;
            this.modalForm = { title: '', description: '', progress: 0, date: '', subtasks: '0/0' };
        },
        
        deleteTask(taskId) {
            if (!confirm('Delete this task?')) return;
            
            const projectId = this.projectId;
            fetch(`/tasks/${projectId}/items/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    // Remove task from sections array
                    this.sections.forEach(section => {
                        section.task_items = section.task_items.filter(t => t.id !== taskId);
                    });
                    this.showToast('Task deleted');
                }
            })
            .catch(err => console.error('Error deleting task:', err));
        },
        
        confirmTrashTask() {
            this.showToast('Trash functionality coming soon');
        },
        
        showInviteModal() {
            this.showToast('Invite feature coming soon');
        },
        
        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        },
        
        // Subtask Management
        openSubtaskModal(task) {
            this.currentTaskForSubtasks = task;
            this.subtaskForm.newSubtaskTitle = '';
            this.showSubtaskModal = true;
            this.loadSubtasks(task.id);
        },
        
        initSubtaskSortable() {
            const container = document.getElementById('subtasks-container');
            console.log('🔧 Initializing Sortable, container:', container);
            console.log('📋 Current subtasks:', this.subtasks);
            
            if (!container) {
                console.error('❌ Subtasks container not found!');
                return;
            }
            
            if (this.subtaskSortable) {
                console.log('🔄 Destroying existing Sortable instance');
                this.subtaskSortable.destroy();
            }
            
            const self = this;
            
            this.subtaskSortable = Sortable.create(container, {
                animation: 200,
                // handle: '.drag-handle',  // Temporarily disabled for testing
                draggable: '.subtask-item',
                ghostClass: 'subtask-ghost',
                chosenClass: 'subtask-chosen',
                dragClass: 'subtask-dragging',
                easing: 'cubic-bezier(1, 0, 0, 1)',
                forceFallback: false,
                fallbackTolerance: 3,
                onStart: function(evt) {
                    console.log('🎯 Drag started, oldIndex:', evt.oldIndex);
                },
                onEnd: function(evt) {
                    console.log('✋ Drag ended, oldIndex:', evt.oldIndex, 'newIndex:', evt.newIndex);
                    
                    const oldIndex = evt.oldIndex;
                    const newIndex = evt.newIndex;
                    
                    if (oldIndex === newIndex) {
                        console.log('⏸️ No position change');
                        return;
                    }
                    
                    console.log('📊 Before reorder:', self.subtasks.map(s => s.title));
                    
                    // Create a copy of the subtasks array
                    const reorderedSubtasks = [...self.subtasks];
                    
                    // Remove from old position
                    const [movedItem] = reorderedSubtasks.splice(oldIndex, 1);
                    
                    // Insert at new position
                    reorderedSubtasks.splice(newIndex, 0, movedItem);
                    
                    console.log('📊 After reorder:', reorderedSubtasks.map(s => s.title));
                    
                    // Update Alpine's reactive array
                    self.subtasks = reorderedSubtasks;
                    
                    // Update order property and save to backend
                    self.subtasks.forEach((subtask, index) => {
                        subtask.order = index + 1;
                    });
                    
                    console.log('💾 Calling reorderSubtasks...');
                    self.reorderSubtasks();
                }
            });
            
            console.log('✅ Sortable initialized successfully');
        },
        
        loadSubtasks(taskId) {
            console.log('🔍 Loading subtasks for task:', taskId);
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
                console.log('📦 Subtasks loaded:', data);
                if (data.ok) {
                    this.subtasks = data.subtasks || [];
                    console.log('⏱️ Scheduling Sortable init in 100ms...');
                    // Initialize Sortable after subtasks are loaded and rendered
                    setTimeout(() => {
                        console.log('🚀 Calling initSubtaskSortable now...');
                        this.initSubtaskSortable();
                    }, 100);
                }
            })
            .catch(err => console.error('❌ Error loading subtasks:', err));
        },
        
        closeSubtaskModal() {
            this.showSubtaskModal = false;
            this.currentTaskForSubtasks = null;
            this.subtasks = [];
            this.subtaskForm.newSubtaskTitle = '';
            
            // Destroy Sortable instance
            if (this.subtaskSortable) {
                this.subtaskSortable.destroy();
                this.subtaskSortable = null;
            }
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
                    this.showToast('Subtask added');
                    this.updateTaskProgress();
                }
            })
            .catch(err => console.error('Error adding subtask:', err));
        },
        
        removeSubtask(subtaskId) {
            if (!confirm('Delete this subtask?')) return;
            
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
                    this.showToast('Subtask removed');
                    this.updateTaskProgress();
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
                    this.updateTaskProgress();
                }
            })
            .catch(err => console.error('Error toggling subtask:', err));
        },
        
        // Subtask Drag and Drop Methods
        subtaskDragStart(event, index) {
            this.draggedSubtaskIndex = index;
            event.dataTransfer.effectAllowed = 'move';
            event.currentTarget.style.opacity = '0.5';
            event.currentTarget.style.cursor = 'grabbing';
        },
        
        subtaskDragEnd(event) {
            event.currentTarget.style.opacity = '1';
            event.currentTarget.style.cursor = 'move';
            this.draggedSubtaskIndex = null;
        },
        
        subtaskAllowDrop(event) {
            if (this.draggedSubtaskIndex === null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        
        subtaskDragEnter(event) {
            if (this.draggedSubtaskIndex === null) return;
            event.preventDefault();
            event.currentTarget.classList.add('subtask-drag-over');
        },
        
        subtaskDragLeave(event) {
            if (this.draggedSubtaskIndex === null) return;
            event.currentTarget.classList.remove('subtask-drag-over');
        },
        
        subtaskDrop(event, targetIndex) {
            event.preventDefault();
            event.currentTarget.classList.remove('subtask-drag-over');
            
            if (this.draggedSubtaskIndex === null || this.draggedSubtaskIndex === targetIndex) return;
            
            // Remove from old position
            const [movedSubtask] = this.subtasks.splice(this.draggedSubtaskIndex, 1);
            
            // Insert at new position
            this.subtasks.splice(targetIndex, 0, movedSubtask);
            
            // Update order and save
            this.reorderSubtasks();
            
            this.draggedSubtaskIndex = null;
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
            
            this.subtasks.forEach((subtask, index) => {
                subtask.order = index + 1;
            });
            
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
                    this.showToast('Subtasks reordered');
                }
            })
            .catch(err => console.error('Error reordering subtasks:', err));
        },
        
        getSubtaskProgress() {
            if (this.subtasks.length === 0) return 0;
            const completed = this.subtasks.filter(s => s.is_completed).length;
            return Math.round((completed / this.subtasks.length) * 100);
        },
        
        updateTaskProgress() {
            if (!this.currentTaskForSubtasks) return;
            
            const progress = this.getSubtaskProgress();
            const projectId = this.projectId;
            const taskId = this.currentTaskForSubtasks.id;
            
            // Update the task's progress in the backend
            fetch(`/tasks/${projectId}/items/${taskId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    progress: progress,
                    alt_progress: progress
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    // Update the task in the sections array
                    this.sections.forEach(section => {
                        const taskIndex = section.task_items.findIndex(t => t.id === taskId);
                        if (taskIndex !== -1) {
                            section.task_items[taskIndex].progress = progress;
                            section.task_items[taskIndex].alt_progress = progress;
                            section.task_items[taskIndex].subtasks = this.subtasks;
                        }
                    });
                    
                    // Update currentTaskForSubtasks
                    if (this.currentTaskForSubtasks) {
                        this.currentTaskForSubtasks.progress = progress;
                        this.currentTaskForSubtasks.subtasks = this.subtasks;
                    }
                }
            })
            .catch(err => console.error('Error updating task progress:', err));
        },
        
        updateTaskInList() {
            this.loadSections();
        }
    };
    
    return taskManager_instance;
}
 
