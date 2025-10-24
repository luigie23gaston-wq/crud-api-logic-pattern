<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CityController extends Controller
{
    /**
     * Search cities and regions for autosuggest.
     * GET /api/search-city?q=term
     */
    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));
        if ($q === '') {
            return response()->json(['ok' => true, 'data' => []]);
        }

        try {
            $term = mb_strtolower($q);

            // If City model exists, search cities and also provinces/regions via relations
            if (class_exists(\App\Models\City::class)) {
                $cacheKey = 'citysearch:' . md5($term);
                $payload = Cache::remember($cacheKey, 600, function () use ($term) {
                    $query = \App\Models\City::with(['province','region'])
                        ->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereHas('province', function ($b) use ($term) {
                            $b->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                        })
                        ->orWhereHas('region', function ($r) use ($term) {
                            $r->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                        })
                        ->limit(50);

                    $cities = $query->get();

                    // map and dedupe by city+province
                    $seen = [];
                    $out = $cities->map(function ($c) use (&$seen) {
                        $provName = $c->province?->name ?? $c->province ?? '';
                        $key = mb_strtolower(($c->name ?? '') . '|' . $provName);
                        if (isset($seen[$key])) return null;
                        $seen[$key] = true;

                        return [
                            'id' => $c->id,
                            'city' => $c->name,
                            'province' => $provName ?: null,
                            'region' => $c->region?->name ?? $c->region ?? null,
                            'city_type' => $c->city_type ?? null,
                        ];
                    })->filter()->values()->slice(0, 8);

                    return $out;
                });

                return response()->json(['ok' => true, 'data' => $payload]);
            }

            // Fallback: try raw DB table 'cities' and also search provinces/regions
            if (\Schema::hasTable('cities')) {
                $rows = DB::table('cities')
                    ->leftJoin('regions', 'cities.region_id', '=', 'regions.id')
                    ->leftJoin('provinces', 'cities.province_id', '=', 'provinces.id')
                    ->whereRaw('LOWER(cities.name) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(provinces.name) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(regions.name) LIKE ?', ["%{$term}%"])
                    ->select('cities.id','cities.name as city','provinces.name as province','regions.name as region','cities.city_type')
                    ->limit(50)
                    ->get();

                // dedupe
                $seen = new \stdClass();
                $out = [];
                $keys = [];
                foreach ($rows as $r) {
                    $key = mb_strtolower(($r->city ?? '') . '|' . ($r->province ?? ''));
                    if (in_array($key, $keys, true)) continue;
                    $keys[] = $key;
                    $out[] = $r;
                    if (count($out) >= 8) break;
                }

                return response()->json(['ok' => true, 'data' => $out]);
            }
        } catch (\Throwable $e) {
            // Fail gracefully
            \Log::warning('City search failed: ' . $e->getMessage());
        }

        return response()->json(['ok' => true, 'data' => []]);
    }
}
