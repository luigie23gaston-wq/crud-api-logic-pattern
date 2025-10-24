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
                    return response()->json([
                        'ok' => false,
                        'message' => $msg,
                        'suggestions' => $suggestions,
                    ], 422);
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
            return response()->json([
                'ok' => false,
                'message' => 'OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env and add service config.',
            ], 500);
        }

        try {
            $url = config('services.openweather.base') . 'weather';

            // Cache key per-city (lowercased). Cache successful responses for 10 minutes (600s)
            $cacheKey = 'weather:' . strtolower(preg_replace('/\s+/', '_', $city));

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

                // Save minimal history only when we actually call the API (not on cache hits)
                WeatherSearch::create([
                    'city' => $data['name'] ?? $city,
                    'country' => $data['sys']['country'] ?? null,
                    'response' => $data,
                    'ip' => $request->ip(),
                ]);

                return $data;
            });

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
        } catch (\Exception $e) {
            // Handle known city-not-found exception as 422; other exceptions become 500
            if ($e->getMessage() === 'City not found or API error.') {
                return response()->json([
                    'ok' => false,
                    'message' => 'City not found or API error.',
                ], 422);
            }

            \Log::error('WeatherController::fetch error: ' . $e->getMessage());
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error while fetching weather.',
            ], 500);
        }
    }
}
