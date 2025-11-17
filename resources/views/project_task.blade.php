<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Project Management Dashboard</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <link rel="stylesheet" href="{{ asset('css/project_task.css') }}?v={{ time() }}">
  <link rel="stylesheet" href="{{ asset('css/tailwind.css') }}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="project-gradient-bg">
  <!-- Clearfix header -->
  <div class="w-full kanban-clearfix">
    <div class="max-w-screen-lg kanban-container">
      @auth
      <div class="flex items-center justify-end kanban-header-row">
        <div class="kanban-welcome-group flex items-center space-x-3">
          <!-- Notification bell -->
          <div x-data="{ open: false }" class="relative notif-root">
            <button class="notif-btn text-purple-600 hover:text-purple-800 focus:outline-none cursor-pointer z-50" @click="open = !open" @keydown.escape.window="open = false" aria-haspopup="true" :aria-expanded="open.toString()" type="button" aria-label="Notifications">
              <i class="fa fa-bell fa-lg" aria-hidden="true"></i>
            </button>
            <div class="notif-menu hidden absolute right-0 mt-2 w-72 max-h-56 overflow-auto bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 z-50" x-show="open" x-cloak x-transition x-on:click.away="open = false">
              <div id="notifications" class="p-2"></div>
            </div>
          </div>
          <div class="kanban-welcome-text">Welcome,</div>
          <div id="current-username" class="kanban-username">{{ Auth::user()->username }}</div>
          <form id="logout-form" method="POST" action="{{ route('auth.logout') }}" class="inline" aria-label="Logout">
            @csrf
            <button id="logoutBtn" type="submit" class="logout-btn kanban-logout" aria-label="Logout">
              <i class="fa fa-sign-out-alt" aria-hidden="true"></i>
              <span class="sr-only">Logout</span>
            </button>
          </form>
        </div>
      </div>
      @endauth
    </div>
  </div>

  <!-- Navbar -->
  <nav class="kanban-navbar">
    <div class="kanban-container">
      <ul class="kanban-nav-list" role="navigation" aria-label="Main Navigation">
        <li><a href="{{ url('/') }}" class="kanban-nav-link">Home</a></li>
        <li><a href="{{ route('weather.index') }}" class="kanban-nav-link">Weather</a></li>
        <li><a href="{{ route('project.task') }}" class="kanban-nav-link">Project</a></li>
      </ul>
    </div>
  </nav>

  <div class="kanban-separator"></div>

  <!-- Scrolling area: contains the dashboard so body remains non-scrollable -->
  <div class="project-scroll-area">

  <!-- Dashboard Container -->
  <div x-data="projectDashboard()" x-init="init()" class="dashboard-container" data-user-id="{{ Auth::id() }}">
    <div class="dashboard-wrapper">
      <!-- Header -->
      <header class="dashboard-header">
        <h1 class="dashboard-title">PROJECT TASK MANAGEMENT</h1>
      
      </header>

      <!-- Stats Cards Row -->
      <div class="stats-cards-row">
        <div class="stat-card stat-card-green">
          <div class="stat-card-icon">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="stat-card-content">
            <p class="stat-card-number" x-text="stats.total"></p>
            <p class="stat-card-label">Total Projects</p>
          </div>
        </div>
        <div class="stat-card stat-card-blue">
          <div class="stat-card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-card-content">
            <p class="stat-card-number" x-text="stats.active"></p>
            <p class="stat-card-label">Active Projects</p>
          </div>
        </div>
        <div class="stat-card stat-card-cyan">
          <div class="stat-card-icon">
            <i class="fas fa-archive"></i>
          </div>
          <div class="stat-card-content">
            <p class="stat-card-number">0</p>
            <p class="stat-card-label">Archived Projects</p>
          </div>
        </div>
        <div class="stat-card stat-card-pink">
          <div class="stat-card-icon">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-card-content">
            <p class="stat-card-number">0</p>
            <p class="stat-card-label">Owned Projects</p>
          </div>
        </div>
      </div>

      <!-- Main Content Row -->
      <div class="main-content-row">
        <!-- Active Projects -->
        <div class="right-main full-width">
          <div class="project-card">
            <!-- Header with view toggle -->
            <div class="projects-header">
              <div class="projects-header-left">
                <button class="btn-create" @click="showCreateModal = true">
                  <i class="fas fa-plus"></i> Create Project
                </button>

              </div>
              <div class="projects-header-right">
                <button class="btn-icon-toggle" :class="{ 'active': viewMode === 'table' }" @click="viewMode = 'table'">
                  <i class="fas fa-table"></i> Table layout
                </button>
                <button class="btn-icon-toggle" :class="{ 'active': viewMode === 'grid' }" @click="viewMode = 'grid'">
                  <i class="fas fa-th-large"></i> Grid layout
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div x-show="loading" class="flex justify-center items-center py-12">
              <div class="text-center">
                <i class="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
                <p class="text-gray-600">Loading projects...</p>
              </div>
            </div>

            <!-- Empty State -->
            <div x-show="!loading && projects.active.length === 0" class="text-center py-12">
              <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
              <h3 class="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
              <p class="text-gray-500 mb-4">Create your first project to get started</p>

            </div>

            <!-- Grid View -->
            <div x-show="!loading && viewMode === 'grid' && projects.active.length > 0" class="projects-grid">
              <template x-for="project in projects.active" :key="project.id">
                <div class="project-grid-card">
                  <div class="project-grid-header">
                    <div class="project-grid-icon" :class="'icon-' + project.iconColor">
                      <i :class="project.icon"></i>
                    </div>
                    <div class="project-grid-actions" x-data="{ open: false }" @click.away="open = false">
                      <button class="btn-icon-sm" @click="open = !open" type="button">
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                      <div x-show="open" 
                           x-cloak
                           x-transition:enter="transition ease-out duration-100"
                           x-transition:enter-start="transform opacity-0 scale-95"
                           x-transition:enter-end="transform opacity-100 scale-100"
                           x-transition:leave="transition ease-in duration-75"
                           x-transition:leave-start="transform opacity-100 scale-100"
                           x-transition:leave-end="transform opacity-0 scale-95"
                           class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-1 border border-gray-200">
                        <button @click="editProject(project); open = false" 
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                          <i class="fas fa-edit text-blue-500"></i> Edit Project
                        </button>
                        <button @click="duplicateProject(project); open = false" 
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                          <i class="fas fa-copy text-green-500"></i> Duplicate
                        </button>
                        <button @click="archiveProject(project.id); open = false" 
                                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <i class="fas fa-archive"></i> Archive
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 class="project-grid-title" x-text="project.name"></h3>
                  <p class="project-grid-desc" x-text="project.description"></p>
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <p class="text-xs text-gray-600 mb-3">Owner: <span class="font-semibold" x-text="project.user_name"></span></p>
                    <a :href="'/tasks/' + project.id" class="w-full inline-block text-center bg-purple-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-purple-700 transition text-sm">
                      <i class="fas fa-tasks mr-2"></i>View Tasks
                    </a>
                  </div>
                </div>
              </template>
            </div>

            <!-- Table View -->
            <div x-show="!loading && viewMode === 'table' && projects.active.length > 0" class="projects-table-wrapper">
              <table class="projects-table">
                <thead>
                  <tr>
                    <th class="col-star"></th>
                    <th class="col-icon"></th>
                    <th class="col-name">Project Name</th>
                    <th class="col-description">Description</th>
                    <th class="col-status">Status</th>
                    <th class="col-progress">Progress</th>
                    <th class="col-members">Members</th>
                    <th class="col-group">Project Group</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <template x-for="project in projects.active" :key="project.id">
                    <tr class="table-row">
                      <td class="col-star"><i class="far fa-star"></i></td>
                      <td class="col-icon">
                        <div class="table-project-icon" :class="'icon-' + project.iconColor">
                          <i :class="project.icon"></i>
                        </div>
                      </td>
                      <td class="col-name">
                        <div>
                          <p class="font-medium" x-text="project.name"></p>
                          <p class="text-xs text-gray-600" x-text="project.user_name"></p>
                        </div>
                      </td>
                      <td class="col-description" x-text="project.description"></td>
                      <td class="col-status">
                        <span class="status-badge" :class="'status-' + project.statusColor" x-text="project.status"></span>
                      </td>
                      <td class="col-progress">
                        <div class="progress-bar-wrapper">
                          <div class="progress-bar" :style="'width: ' + project.progress + '%'"></div>
                        </div>
                      </td>
                      <td class="col-members">
                        <div class="members-avatars">
                          <span class="member-count" x-text="'+' + project.members"></span>
                        </div>
                      </td>
                      <td class="col-group">Not grouped</td>
                      <td class="col-actions">
                        <a :href="'/tasks/' + project.id" class="btn-icon-sm" title="View Tasks">
                          <i class="fas fa-tasks"></i>
                        </a>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Include Create Project Modal (inside Alpine scope) -->
    @include('modal.project_task_create_modal')
    
    <!-- Include Edit Project Modal (inside Alpine scope) -->
    @include('modal.project_task_edit_modal')
  </div>

  </div> <!-- /.project-scroll-area -->

  <script src="{{ asset('js/project_task.js') }}?v={{ time() }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</body>
</html>