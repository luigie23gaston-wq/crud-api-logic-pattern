---
applyTo: '**'
---

# Region & City Auto-suggest (Dropdown) — Implementation Notes

This instruction file documents a lightweight, UX-friendly auto-suggest for searching regions and cities and wiring that into the Weather UI. It includes DB layout, Laravel route/controller suggestions, frontend patterns (debounce + AJAX), recommended JSON shape, and implementation notes for performance, accessibility, and caching.

## User flow

- User types a region or city name into the search input on the Weather page.
- A small debounce (200–350ms) triggers an AJAX request to an `api` route with the typed text.
- Laravel searches the `cities` table (and joins `regions`/`provinces`) for matches.
- The API returns a small list (limit 8) in a compact JSON shape containing `region` → `province` → `city` items.
- Frontend renders an absolute-positioned dropdown with suggestion rows like: `NCR > Quezon City`.
- User clicks a suggestion (or presses Enter) → frontend uses the selected city to call the weather endpoint and show results.

## DB structure (recommended)

- `regions`:

  | id | name |
  |---:|------|
  | 1  | NCR  |
  | 2  | Region IV-A |

- `provinces` (optional, helps disambiguate cities):

  | id | region_id | name |

- `cities`:

  | id | region_id | province_id | name | city_type |

Indexing tips:
- Add indexes on `cities.name` and compound index on (`region_id`,`province_id`,`name`) for fast prefix/LIKE queries.
- Consider a `FULLTEXT` index for very large datasets and fuzzy search.

## Laravel routes

Use `routes/api.php` for the suggestions (AJAX endpoints). Keep the UI pages in `web.php`.

Example routes:

// routes/api.php
Route::get('/search-city', [CityController::class, 'search']);

// routes/web.php
Route::get('/', [WeatherController::class, 'index'])->name('home');
Route::post('/get-weather', [WeatherController::class, 'getWeather'])->name('getWeather');

Notes:
- Keep the API route rate-limited (Throttle middleware) to prevent abuse.

## Controller: CityController::search (reference)

This controller returns a compact JSON list of matches. It should be fast and avoid heavy relations when possible.

```php
public function search(Request $request)
{
    $q = trim($request->input('q',''));
    if ($q === '') {
        return response()->json(['ok' => true, 'data' => []]);
    }

    // Basic query — searches city name and region name
    $cities = City::with('region','province')
        ->where('name', 'LIKE', "%{$q}%")
        ->orWhereHas('region', function($r) use ($q) {
            $r->where('name', 'LIKE', "%{$q}%");
        })
        ->limit(8)
        ->get();

    // Map to a lightweight shape for the frontend
    $payload = $cities->map(function($c) {
        return [
            'id' => $c->id,
            'city' => $c->name,
            'province' => $c->province?->name,
            'region' => $c->region?->name,
            'city_type' => $c->city_type,
        ];
    });

    return response()->json(['ok' => true, 'data' => $payload]);
}
```

Implementation notes:
- Use `limit(8)` to keep responses small.
- Use eager loading (`with('region','province')`) to avoid N+1.
- For case-insensitive matching in some DBs, normalize to lower-case (`whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])`) if needed.

## Frontend pattern (vanilla JS)

Key points:
- Debounce the input (200–350ms).
- Use `fetch` to GET `/api/search-city?q=...` (CSRF not required for GET on `api.php` in default Laravel settings).
- Render absolute dropdown anchored to the input. Use `backdrop-blur`, `shadow-lg`, `rounded-xl`, and a subtle `hover:scale-[1.01]` for rows.
- Allow keyboard navigation (Up/Down/Enter/Escape) and mouse interaction.

Sample UI skeleton:

```html
<div class="relative">
  <input id="city-search" type="text" class="w-full" placeholder="Search region or city">
  <div id="city-suggestions" class="absolute w-full bg-white shadow-lg rounded-lg mt-1 z-50 hidden"></div>
</div>
```

Sample JS (high-level):

```javascript
const input = document.getElementById('city-search');
const list = document.getElementById('city-suggestions');
let timer;
input.addEventListener('input', (e) => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const q = input.value.trim();
    if (!q) { list.classList.add('hidden'); return; }
    const res = await fetch(`/api/search-city?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    renderSuggestions(json.data || []);
  }, 300);
});

function renderSuggestions(items) {
  if (!items.length) { list.classList.add('hidden'); return; }
  list.innerHTML = items.map(it => `
    <div class="p-2 hover:bg-gray-100 cursor-pointer transition" data-id="${it.id}" data-city="${it.city}">
      ${escapeHtml(it.region)} &gt; ${escapeHtml(it.city)}
    </div>
  `).join('');
  list.classList.remove('hidden');

  // attach click handlers
  list.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const city = el.dataset.city;
      // call weather endpoint with selected city
      fetchWeatherFor(city);
      list.classList.add('hidden');
    });
  });
}

function escapeHtml(s){ return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
```

Keyboard navigation and ARIA:
- Add `role="listbox"` to the suggestions container and `role="option"` to each item.
- Track `aria-activedescendant` and support Up/Down to change the active item, Enter to select, and Escape to close.

## JSON response shape (recommended)

Return a minimal, predictable shape:

```json
{
  "ok": true,
  "data": [
    {"id": 1, "region": "NCR", "province": "NCR", "city": "Quezon City", "city_type": "C"},
    {"id": 2, "region": "NCR", "province": "NCR", "city": "Manila", "city_type": "C"}
  ]
}
```

Alternatively, provide grouped results like:

```json
{
  "regions": [
    {"name":"NCR","cities":[{"id":1,"name":"Quezon City"},{"id":2,"name":"Manila"}]}
  ]
}
```

## Performance & caching

- Use DB indexes on text columns used for search.
- Consider a server cache (Cache::remember) for frequently searched terms.
- Use throttle middleware on the API route to avoid abuse:

```php
Route::middleware('throttle:30,1')->get('/search-city', [CityController::class, 'search']);
```

## Security

- Validate user input (`q`) and keep results limited to a small number.
- Escape all output on the frontend.

## Seeding

- Use the provided `database/seeders` JSON import approach to bulk-insert cities. The example `CitiesSeeder` expects `database/seeders/data/ph_locations.json`.

## Integration with Weather flow

- When a city suggestion is selected, call the existing weather endpoint (e.g., POST `/weather/fetch` or `/get-weather`) with the selected city name. The Weather controller should accept a `city` parameter and return the weather JSON used by the UI.

## Developer checklist (quick)
- [ ] Add migrations for `regions`, `provinces`, `cities` (if not present). Example migration filenames in this repo:
  - `2025_10_24_000001_create_regions_table.php`
  - `2025_10_24_000002_create_provinces_table.php`
  - `2025_10_24_000003_create_cities_table.php`
- [ ] Create models `Region`, `Province`, `City` with relations.
- [ ] Add `routes/api.php` route for `/search-city` and apply throttling.
- [ ] Create `CityController::search` with the sample query above.
- [ ] Create `public/js/city-search.js` implementing debounce/fetch/render and keyboard navigation.
- [ ] Style the dropdown in `public/css/crud.css` (or a separate CSS file).

---

If you'd like, I can now:
- create the `CityController` and API route, or
- add the frontend JS file `public/js/city-search.js` and wire it into `resources/views/weather.blade.php`, or
- create seeders/sample JSON under `database/seeders/data/` and a small sample of cities.

Tell me which of these you'd like me to implement next and I'll add the code and verify it (run quick route checks and a small local test where possible).
---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.