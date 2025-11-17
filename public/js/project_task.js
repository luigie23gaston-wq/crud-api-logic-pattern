// project_task.js - Project Dashboard Alpine.js Logic

// Alpine.js data component for the project dashboard
function projectDashboard() {
    return {
        // View mode toggle
        viewMode: 'grid', // 'grid' or 'table'
        
        // Show/hide create modal
        showCreateModal: false,

        // Loading state
        loading: true,

        // Project collections
        projects: {
            active: []
        },

        // Project statistics
        stats: {
            total: 0,
            active: 0,
            archived: 0
        },

        // New project form data
        newProject: {
            name: '',
            description: ''
        },

        // Validation errors
        errors: {},

        // Edit modal state
        showEditModal: false,
        editingProject: null,

        // Initialize - fetch projects from API
        async init() {
            await this.fetchProjects();
        },

        // Fetch all projects
        async fetchProjects() {
            this.loading = true;
            try {
                const response = await fetch('/projects', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const data = await response.json();
                
                if (data.ok) {
                    this.projects.active = data.projects;
                    this.stats = data.stats;
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
                this.showToast('Error', 'Failed to load projects');
            } finally {
                this.loading = false;
            }
        },

        // Add new project
        async addProject() {
            // Reset errors
            this.errors = {};

            // Basic validation
            if (this.newProject.name.trim() === '') {
                this.errors.name = ['Project name is required'];
                return;
            }

            try {
                const response = await fetch('/projects', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify(this.newProject),
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (response.ok && data.ok) {
                    // Add new project to the list
                    this.projects.active.unshift(data.project);
                    
                    // Update stats
                    this.stats.total++;
                    this.stats.active++;

                    // Close modal and reset form
                    this.showCreateModal = false;
                    this.newProject = {
                        name: '',
                        description: ''
                    };

                    this.showToast('Success', 'Project created successfully!');
                } else {
                    // Handle validation errors
                    if (data.errors) {
                        this.errors = data.errors;
                    } else {
                        this.showToast('Error', 'Failed to create project');
                    }
                }
            } catch (error) {
                console.error('Error creating project:', error);
                this.showToast('Error', 'Failed to create project');
            }
        },

        // Delete project
        async deleteProject(projectId) {
            if (!confirm('Are you sure you want to delete this project?')) {
                return;
            }

            try {
                const response = await fetch(`/projects/${projectId}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (response.ok && data.ok) {
                    // Remove project from the list
                    this.projects.active = this.projects.active.filter(p => p.id !== projectId);
                    
                    // Update stats
                    this.stats.total--;
                    this.stats.active--;

                    this.showToast('Success', 'Project deleted successfully!');
                } else {
                    this.showToast('Error', 'Failed to delete project');
                }
            } catch (error) {
                console.error('Error deleting project:', error);
                this.showToast('Error', 'Failed to delete project');
            }
        },

        // Edit project - open edit modal
        editProject(project) {
            this.editingProject = { ...project }; // Clone the project
            this.showEditModal = true;
            this.errors = {};
        },

        // Update project
        async updateProject() {
            // Reset errors
            this.errors = {};

            // Basic validation
            if (this.editingProject.name.trim() === '') {
                this.errors.name = ['Project name is required'];
                return;
            }

            try {
                const response = await fetch(`/projects/${this.editingProject.id}`, {
                    method: 'PUT',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        name: this.editingProject.name,
                        description: this.editingProject.description
                    }),
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (response.ok && data.ok) {
                    // Update project in the list
                    const index = this.projects.active.findIndex(p => p.id === this.editingProject.id);
                    if (index !== -1) {
                        this.projects.active[index] = data.project;
                    }

                    // Close modal and reset form
                    this.showEditModal = false;
                    this.editingProject = null;

                    this.showToast('Success', 'Project updated successfully!');
                } else {
                    // Handle validation errors
                    if (data.errors) {
                        this.errors = data.errors;
                    } else {
                        this.showToast('Error', 'Failed to update project');
                    }
                }
            } catch (error) {
                console.error('Error updating project:', error);
                this.showToast('Error', 'Failed to update project');
            }
        },

        // Duplicate project
        async duplicateProject(project) {
            try {
                const response = await fetch('/projects', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        name: project.name + ' (Copy)',
                        description: project.description
                    }),
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (response.ok && data.ok) {
                    // Add duplicated project to the list
                    this.projects.active.unshift(data.project);
                    
                    // Update stats
                    this.stats.total++;
                    this.stats.active++;

                    this.showToast('Success', 'Project duplicated successfully!');
                } else {
                    this.showToast('Error', 'Failed to duplicate project');
                }
            } catch (error) {
                console.error('Error duplicating project:', error);
                this.showToast('Error', 'Failed to duplicate project');
            }
        },

        // Archive project (soft delete)
        async archiveProject(projectId) {
            if (!confirm('Are you sure you want to archive this project?')) {
                return;
            }

            try {
                const response = await fetch(`/projects/${projectId}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (response.ok && data.ok) {
                    // Remove project from the list
                    this.projects.active = this.projects.active.filter(p => p.id !== projectId);
                    
                    // Update stats
                    this.stats.total--;
                    this.stats.active--;
                    this.stats.archived++;

                    this.showToast('Success', 'Project archived successfully!');
                } else {
                    this.showToast('Error', 'Failed to archive project');
                }
            } catch (error) {
                console.error('Error archiving project:', error);
                this.showToast('Error', 'Failed to archive project');
            }
        },

        // Toast notification helper
        showToast(title, message) {
            console.log(`[Toast] ${title}: ${message}`);
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 min-w-[300px] transform transition-all duration-300';
            toast.innerHTML = `
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        ${title === 'Success' 
                            ? '<i class="fas fa-check-circle text-green-500 text-xl"></i>' 
                            : '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>'}
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="font-semibold text-gray-900">${title}</p>
                        <p class="text-sm text-gray-600 mt-1">${message}</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };
}

// Initialize dashboard on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.debug('[project_task] Alpine.js dashboard module loaded');
});


