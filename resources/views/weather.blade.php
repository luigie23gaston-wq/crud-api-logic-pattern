<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Weather — Modern</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  <link rel="stylesheet" href="{{ asset('css/weather.css') }}">
  <!-- Project shared styles (header/navbar) and icons -->
  <link rel="stylesheet" href="{{ asset('css/crud.css') }}?v={{ time() }}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="gradient-bg">
  <!-- Replicated header / clearfix like the welcome page -->
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

  <!-- Empty Navbar (purple) -->
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

  <div class="container-xl container-2xl mx-auto px-4 py-6">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-white">Weather Forecast</h1>
      <p class="text-lg text-slate-200 mt-2">Live search — history stored globally</p>
      <!--<div class="mt-4">
        <a href="{{ url('/') }}" class="inline-block rounded-xl px-4 py-2 bg-white text-slate-800 font-medium hover:opacity-95 transition">Back to Welcome</a>
      </div>-->
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <!-- Search and History Panel -->
      <div class="lg:col-span-1 xl:col-span-2 space-y-6">
        <!-- Search card -->
        <div class="glass-card p-6">
          <label class="block text-lg font-medium text-slate-700 mb-4">Search city</label>
          <form id="weather-form" method="POST" action="{{ route('weather.fetch') }}" class="flex flex-col sm:flex-row gap-3">
            @csrf
            <input id="city-input" name="city" type="text" placeholder="e.g. Manila" required
              class="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base">
            <button type="submit" class="px-6 py-3 rounded-xl gradient-button text-white font-medium transition-all text-base sm:w-auto w-full">
              Search
            </button>
          </form>

          <div id="error" class="mt-4 text-base text-red-600 hidden"></div>

          <div class="mt-6 text-sm text-slate-500">
            Tip: click an item in history to re-search.
          </div>
        </div>

        <!-- History card -->
        <div class="glass-card p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-semibold text-slate-800 text-lg">Search History</h3>
            <a href="{{ route('admin.history') }}" class="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">Manage</a>
          </div>

          <div id="history-list" class="scrollable-history grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <!-- History items will be populated here -->

          </div>
        </div>
      </div>

      <!-- Weather result -->
      <div class="lg:col-span-3 xl:col-span-3 space-y-6">
        <div id="result" class="glass-card p-8 min-h-[400px] flex items-center justify-center">
          <div class="text-center w-full">
            <div class="flex justify-between items-start mb-8">
              <div class="text-left">
                <div class="city-name">Antipolo City, PH</div>
                <div class="weather-desc mt-2">Few Clouds</div>
                <div class="text-slate-500 mt-4">Feels like 37°C</div>
              </div>
              <div class="temp-display">32°C</div>
            </div>
            <div class="flex justify-center my-6">
              <img src="https://cdn-icons-png.flaticon.com/512/1163/1163661.png" alt="Few Clouds" class="weather-icon">
            </div>
            <div class="text-slate-500">Updated: Just now</div>
          </div>
        </div>

        <!-- Weather details -->
        <div id="details" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="detail-card text-center">
            <div class="text-slate-500 text-base mb-2">Humidity</div>
            <div class="text-3xl font-bold text-emerald-600">65%</div>
          </div>
          <div class="detail-card text-center">
            <div class="text-slate-500 text-base mb-2">Wind</div>
            <div class="text-3xl font-bold text-purple-600">3.6 m/s</div>
          </div>
          <div class="detail-card text-center">
            <div class="text-slate-500 text-base mb-2">Pressure</div>
            <div class="text-3xl font-bold text-indigo-600">1012 hPa</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="{{ asset('js/weather.js') }}" defer></script>
  <script src="{{ asset('js/city-search.js') }}" defer></script>
</body>
</html>
