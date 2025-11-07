<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Users — CRUD</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Project CSS -->
    <link rel="stylesheet" href="{{ asset('css/crud.css') }}?v={{ time() }}">
    <!-- Alpine.js (CDN) for lightweight interactivity -->
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <!-- (Tailwind removed — gradient provided by public/css/crud.css instead) -->
</head>
<body class="min-h-screen bg-gradient-to-r from-green-400 to-purple-500 font-sans">

    <!-- Clearfix (green) with Welcome, Username and Logout at the far right -->
    <div class="w-full kanban-clearfix">
        <div class="max-w-screen-lg kanban-container">
            @auth
            <div class="flex items-center justify-end kanban-header-row"> <!-- place content at far right -->
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

    <!-- Empty Navbar (purple background) -->
    <nav class="kanban-navbar">
        <div class="kanban-container">
            <ul class="kanban-nav-list" role="navigation" aria-label="Main Navigation">
                <li><a href="{{ url('/') }}" class="kanban-nav-link">Home</a></li>
                <li><a href="{{ route('weather.index') }}" class="kanban-nav-link">Weather</a></li>
                <li><a href="{{ route('project.task') }}" class="kanban-nav-link">Project</a></li>
            </ul>
        </div>
    </nav>

    <!-- Separator space -->
    <div class="kanban-separator"></div>

    <div class="min-h-screen flex items-start justify-center py-10">
        <div class="w-full max-w-screen-lg px-4">
            <!-- Floating card -->
            <div class="crud-container floating-crud-card overflow-hidden">
                <div class="crud-head-wrap">
                    <div class="crud-head-right">
                        {{-- Username display and logout button placed top-right (see reference) --}}

                    </div>
                    <div class="crud-head-left">
                        <!-- perpage-toggle stays inside the card but absolutely positioned to align with checkbox column -->
                        <div class="hs-dropdown perpage-wrap perpage-absolute">
                            <button id="perpage-toggle" type="button" class="per-page-pill hs-dropdown-toggle" data-perpage-toggle aria-haspopup="menu" aria-expanded="false" aria-label="Per page">
                                <span class="pill-icon"><i class="fa fa-eye"></i></span>
                                <span id="perpage-label">5 Records</span>
                                <svg class="size-4 ml-2" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </button>

                            <div class="hidden perpage-dropdown hs-dropdown-menu" data-perpage-dropdown role="menu" aria-orientation="vertical" aria-labelledby="perpage-toggle">
                                <ul class="p-1 space-y-0.5">
                                    <li class="perpage-item" data-perpage="5">5 Records</li>
                                    <li class="perpage-item" data-perpage="10">10 Records</li>
                                    <li class="perpage-item" data-perpage="25">25 Records</li>
                                    <li class="perpage-item" data-perpage="50">50 Records</li>
                                    <li class="perpage-item" data-perpage="100">100 Records</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="search-box" style="display:flex; align-items:center; gap:8px;">
                            <input id="crud-search" type="text" placeholder="Search..." class="search-input crud-input" data-search-input />
                            <button type="button" class="crud-btn crud-btn-icon crud-btn-primary" data-search-btn aria-label="Search">
                                <i class="fa fa-search"></i>
                            </button>

                            <!-- Gear button placed to the right of the search button -->
                            <div class="relative gear-wrapper">
                                <button id="gearBtn" type="button" class="crud-btn crud-btn-icon crud-btn-primary" data-gear-toggle aria-haspopup="true" aria-expanded="false" aria-label="Settings">
                                    <i class="fa fa-cog"></i>
                                </button>

                                <div class="hidden gear-dropdown" data-gear-dropdown role="menu" aria-hidden="true" aria-orientation="vertical" aria-labelledby="gear-toggle">
                                    <div class="gear-dropdown-inner">
                                        <button type="button" class="gear-item" data-action="create"><i class="fa fa-plus gear-item-icon"></i> Create</button>
                                        <button type="button" class="gear-item" data-action="view"><i class="fa fa-eye gear-item-icon"></i> View</button>
                                        <button type="button" class="gear-item" data-action="edit"><i class="fa fa-edit gear-item-icon"></i> Edit</button>
                                        <button type="button" class="gear-item" data-action="trash"><i class="fa fa-trash gear-item-icon"></i> Trash</button>
                                        <button type="button" class="gear-item" data-action="archive"><i class="fa-solid fa-dumpster gear-item-icon"></i> Trash Archive</button>
                                        <button type="button" class="gear-item" data-action="export-pdf"><i class="fa fa-file-pdf gear-item-icon"></i> Export PDF</button>
                                        <button type="button" class="gear-item" data-action="export-pdf-selected"><i class="fa fa-file-pdf gear-item-icon"></i> Export Selected PDF</button>
                                        <button type="button" class="gear-item" data-action="uncheck"><i class="fa-solid fa-rectangle-xmark gear-item-icon"></i> Uncheck All</button>
                                        <button type="button" class="gear-item" data-action="open-globalchat"><i class="fa-solid fa-comments gear-item-icon"></i> Global Chat</button>
                                      
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="crud-inner">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left w-12">
                                        <input type="checkbox" id="select-all" data-select-all />
                                    </th>
                                    <th class="px-4 py-3 text-left">First Name</th>
                                    <th class="px-4 py-3 text-left">Last Name</th>
                                    <th class="px-4 py-3 text-left">Image</th>
                                    <th class="px-4 py-3 text-left">Created By</th>
                                    <th class="px-4 py-3 text-left">Created At</th>
                                   
                                </tr>
                            </thead>
                            <tbody id="crud-table-body" class="bg-white divide-y divide-gray-200 whitespace-nowrap">
                                <!-- rows injected by public/js/crud.js -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="p-4 border-t crud-footer">
                    <div class="crud-footer-left">
                        <div id="crud-pagination-info" class="text-sm">Showing 0 to 0 of 0 entries</div>
                    </div>
                    <div class="crud-footer-right">
                        <div id="crud-pagination" class="flex items-center space-x-2"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Include modal partials -->
    @includeWhen(file_exists(resource_path('views/modal/create.blade.php')), 'modal.create')
    @includeWhen(file_exists(resource_path('views/modal/view.blade.php')), 'modal.view')
    @includeWhen(file_exists(resource_path('views/modal/edit.blade.php')), 'modal.edit')
    @includeWhen(file_exists(resource_path('views/modal/trash-confirm.blade.php')), 'modal.trash-confirm')
    @includeWhen(file_exists(resource_path('views/modal/archive.blade.php')), 'modal.archive')
    @includeWhen(file_exists(resource_path('views/modal/archive-confirm.blade.php')), 'modal.archive-confirm')
    @includeWhen(file_exists(resource_path('views/modal/logout-confirm.blade.php')), 'modal.logout-confirm')
    @includeWhen(file_exists(resource_path('views/modal/image.blade.php')), 'modal.image')
    @includeWhen(file_exists(resource_path('views/modal/gchat-simple.blade.php')), 'modal.gchat-simple')

    <!-- Upload progress component -->
    @includeWhen(file_exists(resource_path('views/components/upload-progress.blade.php')), 'components.upload-progress')

    <!-- Live region for screen reader announcements -->
    <div id="crud-live-region" class="sr-only" aria-live="polite"></div>

    <!-- Scripts -->
    <!-- NO Alpine.js - using vanilla JavaScript only -->
    <!-- html2pdf: converts DOM to PDF (used for Export PDF action) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js"></script>
    <!-- Global Chat: Simple vanilla JavaScript version -->
    <script src="{{ asset('js/gchat-simple.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/crud.js') }}?v={{ time() }}" defer></script>
    <script src="{{ asset('js/upload.js') }}?v={{ time() }}" defer></script>
    <script src="{{ asset('js/logout.js') }}?v={{ time() }}"></script>
    
    <!-- Set current user ID for global chat -->
    <script>
        window.currentUserId = {{ Auth::id() }};
    </script>
</body>
</html>
