<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Task Board - {{ $project->name }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="stylesheet" href="{{ asset('css/tailwind.css') }}">
    <!-- External CSS -->
    <link rel="stylesheet" href="{{ asset('css/task.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/project_task.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body x-data="taskManager()" x-init="init()" data-project-id="{{ $project->id }}">
<div class="task-gradient-bg">
    <!-- Clearfix header -->
    <div class="task-clearfix">
        <div class="kanban-container">
            @auth
            <div class="task-header-row">
                <div class="task-welcome-group">
                    <div x-data="{ open: false }" class="task-notif-root">
                        <button class="task-notif-btn" @click="open = !open" @keydown.escape.window="open = false" aria-haspopup="true" :aria-expanded="open.toString()" type="button" aria-label="Notifications">
                            <i class="fa fa-bell fa-lg" aria-hidden="true"></i>
                        </button>
                        <div class="task-notif-menu" x-show="open" x-cloak x-transition x-on:click.away="open = false" :class="{ 'show': open }">
                            <div id="notifications" class="p-2"></div>
                        </div>
                    </div>
                    <div class="task-welcome-text">Welcome,</div>
                    <div id="current-username" class="task-username">{{ Auth::user()->username }}</div>
                    <form id="logout-form" method="POST" action="{{ route('auth.logout') }}" class="inline" aria-label="Logout">
                        @csrf
                        <button id="logoutBtn" type="submit" class="task-logout" aria-label="Logout">
                            <i class="fa fa-sign-out-alt" aria-hidden="true"></i>
                            <span class="task-sr-only">Logout</span>
                        </button>
                    </form>
                </div>
            </div>
            @endauth
        </div>
    </div>

    <!-- Navbar -->
    <nav class="task-navbar">
        <div class="kanban-container">
            <ul class="task-nav-list" role="navigation" aria-label="Main Navigation">
                <li><a href="{{ url('/') }}" class="task-nav-link">Home</a></li>
                <li><a href="{{ route('weather.index') }}" class="task-nav-link">Weather</a></li>
                <li><a href="{{ route('project.task') }}" class="task-nav-link">Project</a></li>
            </ul>
        </div>
    </nav>

    <div class="task-separator"></div>

    <!-- Scrolling area: contains the task board so body remains non-scrollable -->
    <div class="task-scroll-area">

    <!-- Task Board Content -->
    <div class="task-content-wrapper">
        <div class="task-max-container">
            <!-- Header -->
            <header class="task-header">
                <div class="task-header-top">
                    <div class="task-header-info">
                        <h1>{{ $project->name }}</h1>
                        <p>{{ $project->description }}</p>
                    </div>
                    <a href="{{ route('project.task') }}" class="task-back-btn">
                        <i class="fas fa-arrow-left"></i>Back to Projects
                    </a>
                </div>
            </header>

            <!-- Owner Section -->
            <div class="task-owner-section">
                <h2>Project Owner</h2>
                <div class="task-owner-info">
                    <div class="task-owner-avatar">
                        {{ strtoupper(substr($project->user->username, 0, 1)) }}
                    </div>
                    <div class="task-owner-details">
                        <p class="task-owner-name">{{ $project->user->username }}</p>
                        <p class="task-owner-email">{{ $project->user->email }}</p>
                    </div>
                </div>
            </div>

            <!-- Action Buttons Section -->
            <div class="task-action-buttons">
                <button @click="showAddSectionModal()" class="task-add-btn-large" type="button">
                    <i class="fas fa-plus"></i> Add Section
                </button>
                <button @click="confirmTrashTask()" class="task-trash-btn" type="button">
                    <i class="fas fa-trash-alt"></i> Trash Task
                </button>
                <button @click="showInviteModal()" class="task-invite-btn" type="button">
                    <i class="fas fa-user-plus"></i> Invite
                </button>
            </div>

            <!-- Sections Board -->
            <div class="task-board">
                <!-- Sections Container -->
                <div class="sections-container" id="sections-container">
                    <template x-for="(section, sectionIndex) in sections" :key="section.id">
                        <div class="task-section"
                             :data-section-index="sectionIndex"
                             @dragover="sectionAllowDrop($event)"
                             @drop="sectionDrop($event, section)"
                             @dragenter="sectionDragEnter($event)"
                             @dragleave="sectionDragLeave($event)">
                            <!-- Section Header -->
                            <div class="section-header"
                                 draggable="true"
                                 @dragstart="sectionDragStart($event, section)"
                                 @dragend="sectionDragEnd($event)">
                                <div class="section-title-wrapper">
                                    <span 
                                        class="section-title"
                                        @dblclick="editSectionTitle(section)"
                                        x-text="section.title"
                                        x-show="!section.editing"></span>
                                    <input 
                                        type="text"
                                        class="section-title-input"
                                        x-model="section.title"
                                        x-show="section.editing"
                                        @blur="saveSectionTitle(section)"
                                        @keydown.enter="saveSectionTitle(section)"
                                        @keydown.escape="cancelSectionEdit(section)">
                                    <button @click="showAddTaskModal(section)" class="section-add-task-btn" type="button" title="Add task">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                <button @click="deleteSection(section.id)" class="section-delete-btn" type="button" title="Delete section">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>

                            <!-- Task Cards in Section -->
                            <div class="section-tasks"
                                 @drop="drop($event, section.id)"
                                 @dragover="allowDrop($event)"
                                 @dragenter="dragEnter($event)"
                                 @dragleave="dragLeave($event)">
                                <template x-for="task in section.task_items" :key="task.id">
                                    <div class="task-card"
                                         @click="editTask(task)">
                                        <div class="task-card-header">
                                            <h3 class="task-card-title" x-text="task.title"></h3>
                                            <button @click.stop="deleteTask(task.id)" class="task-card-delete" title="Delete" type="button">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        
                                        <div class="task-progress-section">
                                            <div class="task-progress-label">
                                                <span>Progress</span>
                                                <span x-text="task.progress + '%'"></span>
                                            </div>
                                            <div class="task-progress-bar">
                                                <div class="task-progress-fill" :style="'width: ' + task.progress + '%'"></div>
                                            </div>
                                        </div>

                                        <!-- Task Description -->
                                        <template x-if="task.description">
                                            <div class="task-description" style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280; line-height: 1.4;">
                                                <p x-text="task.description"></p>
                                            </div>
                                        </template>
                                        
                                        <div class="task-meta">
                                            <span>
                                                <i class="fas fa-check-circle"></i>
                                                <span x-text="(task.subtasks?.filter(s => s.is_completed).length || 0) + '/' + (task.subtasks?.length || 0)"></span>
                                            </span>
                                            <span x-text="task.date"></span>
                                        </div>

                                        <!-- View Subtask Button -->
                                        <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                                            <button @click.stop="openSubtaskModal(task)" 
                                                    class="task-add-btn" 
                                                    style="flex: 1; font-size: 0.8rem; padding: 0.5rem;" 
                                                    type="button">
                                                <i class="fas fa-list-check"></i> View Subtask
                                            </button>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- modals moved to bottom of page to avoid stacking contexts -->
    </div>

    <!-- JavaScript files -->
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script src="{{ asset('js/task.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/logout.js') }}?v={{ time() }}"></script>
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    
    <!-- Move Alpine root and modals to body so overlays won't be clipped -->

    <!-- Include Task Modal (outside of the content wrapper) -->
    @include('modal.task_modal')

    <!-- Include Subtask Modal (outside of the content wrapper) -->
    @include('modal.subtask_modal')

    </div>

    </div> <!-- /.task-scroll-area -->
    </body>
</html>


