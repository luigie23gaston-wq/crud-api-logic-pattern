<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
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
        // If the user typed a province name (e.g., "Pampanga"), give a helpful message
        try {
            if (class_exists(\App\Models\Province::class)) {
                $prov = \App\Models\Province::whereRaw('LOWER(name) = ?', [strtolower($city)])->first();
                if ($prov) {
                    // attempt to suggest a representative city
                    $sample = null;
                    if (class_exists(\App\Models\City::class)) {
                        $sample = \App\Models\City::where('province_id', $prov->id)->first();
                    }

                    $suggest = $sample ? ($sample->name . ', PH') : null;
                    // build list of suggested cities in province (up to 5)
                    $suggestions = [];
                    try {
                        if (class_exists(\App\Models\City::class)) {
                            $list = \App\Models\City::where('province_id', $prov->id)->limit(5)->get();
                            foreach ($list as $c) {
                                $suggestions[] = ['id' => $c->id, 'name' => $c->name];
                            }
                        }
                    } catch (\Throwable $ee) { /* ignore */ }

                    $msg = $suggest ? "Please pick a city — we found a province named {$prov->name}; try '{$suggest}' or pick from suggestions." : "Please pick a city — we found a province named {$prov->name}; pick from suggestions.";
                    $payload = [
                        'ok' => false,
                        'message' => $msg,
                        'suggestions' => $suggestions,
                    ];
                    if ($request->expectsJson()) {
                        return response()->json($payload, 422);
                    }

                    // Non-AJAX fallback: flash a friendly message and optional suggestions
                    return redirect()->back()->with('error', $msg)->with('suggestions', $suggestions);
                }
            }
        } catch (\Throwable $e) {
            // ignore lookup errors and continue to normal flow
        }
        // Defensive implementation: check config key and catch exceptions so the AJAX client
        // receives a structured JSON error instead of an HTML 500 page.
        $apiKey = config('services.openweather.key');
        if (empty($apiKey)) {
            // Helpful error for debugging when API key isn't set
            $msg = 'OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env and add service config.';
            $payload = [ 'ok' => false, 'message' => $msg ];
            if ($request->expectsJson()) {
                return response()->json($payload, 500);
            }

            return redirect()->back()->with('error', $msg);
        }

        try {
            $url = config('services.openweather.base') . 'weather';

            // Cache key per-city (lowercased). Cache successful responses for 10 minutes (600s)
            $cacheKey = 'weather:' . strtolower(preg_replace('/\s+/', '_', $city));

            // Record whether we expect to read from cache. If cache has the key, we'll
            // mark $fromCache=true so we can still log the search after reading cached data.
            $fromCache = Cache::has($cacheKey);

            $data = Cache::remember($cacheKey, 600, function () use ($url, $apiKey, $city, $request) {
                $res = Http::timeout(10)->get($url, [
                    'q' => $city,
                    'appid' => $apiKey,
                    'units' => 'metric',
                ]);

                if ($res->failed()) {
                    // Throw to avoid caching failure responses
                    throw new \Exception('City not found or API error.');
                }

                $data = $res->json();

                return $data;
            });

            // Record the search in WeatherSearch for both cache hits and misses.
            // We create a record here after we have $data to ensure each user-triggered
            // search is stored exactly once.
            try {
                WeatherSearch::create([
                    'city' => $data['name'] ?? $city,
                    'country' => $data['sys']['country'] ?? null,
                    'response' => $data,
                    'ip' => $request->ip(),
                ]);
            } catch (\Throwable $ee) {
                // Ignore logging errors to avoid breaking the main flow
            }

            $responsePayload = [
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
            ];

            if ($request->expectsJson()) {
                return response()->json($responsePayload);
            }

            // Non-AJAX: flash a minimal success payload to the session so blade can render a fallback
            return redirect()->back()->with('weather_result', $responsePayload['data']);
        } catch (\Exception $e) {
            // Handle known city-not-found exception as 422; other exceptions become 500
            if ($e->getMessage() === 'City not found or API error.') {
                $msg = 'City not found or API error.';
                if ($request->expectsJson()) {
                    return response()->json(['ok' => false, 'message' => $msg], 422);
                }

                return redirect()->back()->with('error', $msg);
            }

            \Log::error('WeatherController::fetch error: ' . $e->getMessage());
            $msg = 'Unexpected server error while fetching weather.';
            if ($request->expectsJson()) {
                return response()->json(['ok' => false, 'message' => $msg], 500);
            }

            return redirect()->back()->with('error', $msg);
        }
    }
}
