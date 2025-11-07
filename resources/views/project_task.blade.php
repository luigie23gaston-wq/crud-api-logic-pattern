<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Project Task</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <link rel="stylesheet" href="{{ asset('css/project_task.css') }}?v={{ time() }}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
  <div class="w-full kanban-clearfix">
    <div class="max-w-screen-lg kanban-container">
      @auth
      <div class="flex items-center justify-end kanban-header-row">
        <div class="kanban-welcome-group">
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

  <div class="max-w-screen-lg mx-auto p-6">
    <!-- Empty body container for Project Task as requested -->
    <div class="project-task-body">
      <div class="project-task-empty"></div>
    </div>
  </div>
</body>
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
<script src="{{ asset('js/project_task.js') }}?v={{ time() }}" defer></script>
</html>
</body>
</html>
