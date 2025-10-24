# Weather Web App — Setup Instructions

This document contains step-by-step, copy-paste-ready instructions for adding a small OpenWeather-based Weather app to this Laravel project. It includes config, controller code, migration, model, routes, Blade view, frontend JS, and an optional admin history area. Follow the steps below in order.

> NOTE: The API key below was provided for this task. Store it in your `.env` and do NOT commit your `.env` to source control.

OpenWeather API key (use in .env):

```
OPENWEATHER_API_KEY=06108ff93eee8d6b16af1c79fe962cb5
```

## 1) Add service config

Edit `config/services.php` and add the OpenWeather configuration (uses the env variable above):

```php
'openweather' => [
    'key' => env('OPENWEATHER_API_KEY'),
    'base' => 'https://api.openweathermap.org/data/2.5/',
],
```

## 2) Routes

Add the following routes to `routes/web.php`. Protect admin routes with `auth`/middleware in production.

```php
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\Admin\WeatherHistoryController;

Route::get('/', fn() => redirect('/weather'));
Route::get('/weather', [WeatherController::class, 'index'])->name('weather.index');
Route::post('/weather/fetch', [WeatherController::class, 'fetch'])->name('weather.fetch');

// Admin history (protect these in production)
Route::prefix('admin')->group(function () {
    Route::get('/history', [WeatherHistoryController::class, 'index'])->name('admin.history');
    Route::delete('/history/{weatherSearch}', [WeatherHistoryController::class, 'destroy'])->name('admin.history.destroy');
    Route::post('/history/clear', [WeatherHistoryController::class, 'clearAll'])->name('admin.history.clear');
    // lightweight JSON endpoint for frontend history
    Route::get('/history-data', function () {
        return response()->json([
            'ok' => true,
            'data' => \App\Models\WeatherSearch::select('city','country')->latest()->limit(12)->get()
        ]);
    });
});
```

## 3) Controllers

Create the public-facing controller and the admin controller:

Commands (run locally):

```bash
php artisan make:controller WeatherController
php artisan make:controller Admin/WeatherHistoryController
```

Paste the following into `app/Http/Controllers/WeatherController.php` (AJAX endpoint):

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\WeatherSearch;

class WeatherController extends Controller
{
    public function index()
    {
        return view('weather');
    }

    // AJAX endpoint for fetching weather
    public function fetch(Request $request)
    {
        $request->validate([
            'city' => 'required|string|max:255',
        ]);

        $city = trim($request->city);

        // call OpenWeatherMap current weather
        $url = config('services.openweather.base') . 'weather';
        $apiKey = config('services.openweather.key');

        $res = Http::timeout(10)->get($url, [
            'q' => $city,
            'appid' => $apiKey,
            'units' => 'metric',
        ]);

        if ($res->failed()) {
            return response()->json([
                'ok' => false,
                'message' => 'City not found or API error.',
            ], 422);
        }

        $data = $res->json();

        // Save minimal history (global)
        WeatherSearch::create([
            'city' => $data['name'] ?? $city,
            'country' => $data['sys']['country'] ?? null,
            'response' => $data,
            'ip' => $request->ip(),
        ]);

        // Return structured JSON for frontend
        return response()->json([
            'ok' => true,
            'data' => [
                'city' => $data['name'] ?? $city,
                'country' => $data['sys']['country'] ?? null,
                'temp' => $data['main']['temp'] ?? null,
                'feels_like' => $data['main']['feels_like'] ?? null,
                'humidity' => $data['main']['humidity'] ?? null,
                'wind' => $data['wind']['speed'] ?? null,
                'condition' => $data['weather'][0]['description'] ?? null,
                'icon' => $data['weather'][0]['icon'] ?? null,
            ],
        ]);
    }
}
```

Paste the admin controller into `app/Http/Controllers/Admin/WeatherHistoryController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WeatherSearch;

class WeatherHistoryController extends Controller
{
    public function index()
    {
        $searches = WeatherSearch::latest()->paginate(20);
        return view('admin.history', compact('searches'));
    }

    public function destroy(WeatherSearch $weatherSearch)
    {
        $weatherSearch->delete();
        return back()->with('success','Record deleted.');
    }

    public function clearAll()
    {
        WeatherSearch::truncate();
        return back()->with('success','All history cleared.');
    }
}
```

## 4) Migration

Create the migration:

```bash
php artisan make:migration create_weather_searches_table --create=weather_searches
```

Paste this migration into the generated file in `database/migrations/xxxxxxxx_create_weather_searches_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateWeatherSearchesTable extends Migration
{
    public function up()
    {
        Schema::create('weather_searches', function (Blueprint $table) {
            $table->id();
            $table->string('city');
            $table->string('country')->nullable();
            $table->json('response')->nullable(); // store API response snapshot (optional)
            $table->ipAddress('ip')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('weather_searches');
    }
}
```

Run migrations locally:

```powershell
php artisan migrate
```

## 5) Model

Create `app/Models/WeatherSearch.php` with:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherSearch extends Model
{
    protected $fillable = [
        'city',
        'country',
        'response',
        'ip',
    ];

    protected $casts = [
        'response' => 'array',
    ];
}
```

## 6) Blade view

Create `resources/views/weather.blade.php` (a simple responsive UI). Example below; use Vite or include CSS/JS directly.

```blade
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Weather — Modern</title>
  @vite(['resources/css/app.css','resources/js/weather.js'])
  <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body class="bg-slate-50 min-h-screen">
  <div class="max-w-3xl mx-auto p-4">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold">Weather App</h1>
      <p class="text-sm text-slate-500">Live search — history stored globally.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Search card -->
      <div class="md:col-span-1">
        <div class="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <label class="block text-sm text-slate-600 mb-2">Search city</label>
          <form id="weather-form" class="flex gap-2">
            <input id="city-input" name="city" type="text" placeholder="e.g. Manila" required
              class="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300">
            <button type="submit" class="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition">
              Search
            </button>
          </form>

          <div id="error" class="mt-3 text-sm text-red-600 hidden"></div>

          <div class="mt-4 text-xs text-slate-400">
            Tip: click an item in history to re-search.
          </div>
        </div>

        <!-- History card -->
        <div class="mt-4 bg-white p-4 rounded-2xl shadow-sm">
          <div class="flex justify-between items-center">
            <h3 class="font-medium">Search History</h3>
            <a href="{{ route('admin.history') }}" class="text-xs text-slate-500 hover:underline">Manage</a>
          </div>

          <div id="history-list" class="mt-3 space-y-2">
            <!-- JS will render chips here -->
          </div>
        </div>
      </div>

      <!-- Weather result -->
      <div class="md:col-span-2">
        <div id="result" class="bg-white p-6 rounded-2xl shadow-sm min-h-[220px] flex items-center justify-center">
          <div class="text-slate-400">Search for a city to see weather.</div>
        </div>

        <!-- Additional cards (details) -->
        <div id="details" class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3"></div>
      </div>
    </div>
  </div>
</body>
</html>
```

## 7) Frontend JS

Create `resources/js/weather.js` (vanilla fetch). See the reference implementation in the project or the summary above for a short version. Ensure CSRF token is included.

## 8) Admin history Blade (optional)

Create `resources/views/admin/history.blade.php` to show paginated history and manage deletions. Keep this behind `auth` middleware in production.

## 9) Caching (recommended)

To reduce API calls, cache requests for a short period (e.g., 10 minutes). Example (controller-level):

```php
use Illuminate\Support\Facades\Cache;

$cacheKey = 'weather:'.strtolower($city);
$data = Cache::remember($cacheKey, 600, function () use ($url, $apiKey, $city) {
    $res = Http::get($url, ['q'=>$city,'appid'=>$apiKey,'units'=>'metric']);
    return $res->successful() ? $res->json() : null;
});

if (!$data) { /* handle error */ }
```

## 10) Protect admin routes

Wrap `admin` routes with `middleware(['auth'])` and/or gate checks. For quick testing you can leave them unprotected but do not ship that to production.

## 11) Tailwind (optional)

If you prefer Tailwind instead of the `@vite` pipeline referenced above, initialize it with:

```bash
npm init -y
npm install -D tailwindcss postcss autoprefixer vite
npx tailwindcss init -p
```

Then set `tailwind.config.js` content paths to include `resources/**/*.blade.php` and your JS files.

---

If you want I can now create the controller, model, migration and view files directly in the repository (apply patches). Tell me if you want me to make those edits now, or if you only want this instructions file updated.
---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.