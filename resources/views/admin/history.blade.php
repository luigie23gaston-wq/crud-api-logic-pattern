<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Search History — Weather</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
    <link rel="stylesheet" href="{{ asset('css/weather.css') }}">
    <link rel="stylesheet" href="{{ asset('css/toast.css') }}">
</head>
<body class="gradient-bg">
  <div class="max-w-6xl mx-auto p-6">
    <header class="mb-6">
     
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Search History — Weather</title>
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
        <link rel="stylesheet" href="{{ asset('css/weather.css') }}">
      </head>
      <body class="bg-slate-50 min-h-screen">
        <div class="max-w-6xl mx-auto p-6">
          <header class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800">Search History</h1>
            <p class="text-sm text-slate-500">Global history of weather searches (most recent first)</p>
          </header>

          <div class="bg-white shadow-sm rounded-2xl p-4">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold text-slate-700">Recent Searches</h2>
                <div id="history-meta" class="text-sm text-slate-500 mt-1">
                  @if($searches->total() > 0)
                    Showing {{ $searches->firstItem() }} to {{ $searches->lastItem() }} of {{ $searches->total() }}
                  @else
                    0 results
                  @endif
                </div>
              </div>

              <div class="text-sm text-right space-y-2">
                <button id="clear-history-btn" type="button" class="inline-block rounded-lg px-3 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition">Clear History</button>
                <div>
                  <a href="{{ route('weather.index') }}" class="text-sky-600 hover:text-sky-800 font-medium">Back to Weather</a>
                </div>
              </div>
            </div>

            <div id="history-items" class="grid grid-cols-1 gap-3">
              @include('admin._history_items', ['searches' => $searches])
            </div>

            <div id="history-pagination" class="mt-6">
              @include('admin._history_pagination', ['searches' => $searches])
            </div>
          </div>
        </div>

        @includeWhen(file_exists(resource_path('views/admin/clear-history.blade.php')), 'admin.clear-history')

        {{-- server-flashed success message for toast (hidden) --}}
        @if(session('success'))
          <div id="server-toast" data-message="{{ session('success') }}" class="hidden"></div>
        @endif

        <script src="{{ asset('js/history-pagination.js') }}" defer></script>
        <script src="{{ asset('js/history-clear.js') }}" defer></script>
        <script src="{{ asset('js/toast.js') }}" defer></script>
      </body>
      </html>
                
