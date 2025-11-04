## Copilot / AI agent instructions — crudName

Purpose: Quickly orient an AI coding agent to the repository so it can make safe, low-risk changes.

- Big picture
  - Laravel app with a single AJAX CRUD surface for `UserRecord` (firstname, lastname, image). Frontend is vanilla JS + Blade; backend is Laravel controllers returning JSON.
  - Key endpoints (JSON):
    - GET /users -> paginated JSON (Laravel paginate shape: data, current_page, last_page, per_page, total)
    - GET /users/{id} -> single record JSON
    - POST /users -> create (accepts multipart/form-data or image_path for async uploads)
    - POST /users/upload -> async image upload (returns { path, url })
    - POST /users/{id} -> update
    - DELETE /users -> trash (soft-delete, accepts { ids: [] })

- Where to look (fast links)
  ```markdown
  ## Copilot / AI agent instructions — crudName (merged)

  Purpose: get an AI coding agent productive quickly. Focus on safe, small, well-scoped edits.

  - Big picture
    - Laravel 10 app with two focal UIs: the original AJAX CRUD (UserRecord) and a separate Global Chat modal implemented with vanilla JS polling (5s). Backend controllers return JSON; views are Blade templates.
    - Primary data flows:
      - CRUD: routes in `routes/web.php` → `app/Http/Controllers/UserAjaxController.php` → `app/Models/UserRecord.php` → Blade + `public/js/crud.js`
      - Global chat: routes `/chat/messages` (GET/POST) → `app/Http/Controllers/ChatController.php` → `chat_messages` table → `public/js/gchat-simple.js` → `resources/views/modal/gchat-simple.blade.php`

  - Where to look (fast links)
    - Routes: `routes/web.php`, `routes/api.php` (if used)
    - CRUD controller: `app/Http/Controllers/UserAjaxController.php`
    - Chat controller: `app/Http/Controllers/ChatController.php`
    - Models: `app/Models/UserRecord.php`, `app/Models/ChatMessage.php` (if present)
    - Views: `resources/views/welcome.blade.php`, modal partials `resources/views/modal/gchat-simple.blade.php` and other modal partials
    - Frontend JS: `public/js/crud.js`, `public/js/upload.js`, `public/js/gchat-simple.js`
    - Styles: `public/css/crud.css` (main) and `public/css/gchat.css` (chat-specific)

  - Project-specific conventions & invariants
    - NO INLINE CSS/JS in Blade: all styling belongs in `public/css/*.css` and scripts in `public/js/*.js`. The codebase enforces this (modals previously had inline styles that were removed).
    - Modal partials live in `resources/views/modal/` and are included via Blade (e.g. `@includeWhen(file_exists(resource_path('views/modal/gchat-simple.blade.php')), 'modal.gchat-simple')`). Do not rename modal IDs without updating JS selectors.
    - Frontend expects stable selectors and data-attributes. Examples: `#crud-table-body`, `#gchat-messages`, `#gchat-input`, `data-gchat-close`.

  - AJAX / JS patterns
    - Use the existing `apiFetch`/AJAX wrapper patterns from `public/js/crud.js` (adds `Accept: application/json`, `X-CSRF-TOKEN`, and returns validation errors with `err.type === 'validation'` and `err.payload`). Mirror this when adding endpoints.
    - Upload flow: POST `/users/upload` returns `{ path, url }`. Create/update endpoints accept `image_path` (string) so uploads may be done async.
    - Chat polling: `public/js/gchat-simple.js` polls `/chat/messages` every 5 seconds and renders HTML via template literals. Watch for template literal syntax (use `${expr}`, not shell-style `$((...))`) — a past bug broke rendering.

  - Styling & asset handling
    - Chat styles moved to `public/css/gchat.css`. The app links CSS via Blade with cache-busting in some templates (e.g. `?v={{ time() }}`) — prefer that when editing CSS during development.
    - If UI appears unstyled in the browser, confirm `gchat.css` is loaded (Network tab) and clear cache (Ctrl+Shift+F5). The agent should avoid adding inline styles; fix or add CSS files instead.

  - Developer workflows & quick commands (PowerShell)
    - Frontend build (if you edit JS/CSS):
      ```powershell
      npm install
      npm run dev
      ```
    - Laravel common tasks:
      ```powershell
      php artisan migrate
      php artisan storage:link
      php artisan serve
      php artisan test
      ```

  - Small-change checklist (safe edits)
    1. Identify the modal/template file in `resources/views/modal/` to update.
    2. Edit CSS in `public/css/gchat.css` (chat) or `public/css/crud.css` (global). Add cache-busting query while testing.
    3. Edit rendering logic in `public/js/gchat-simple.js` or `public/js/crud.js`. Keep DOM selectors stable.
    4. Run `npm run dev` (if bundling) and hard-refresh browser.

  - Known gotchas & debug tips
    - Template literal syntax error: JS templates use `${...}` — a shell-style `$((...))` will break rendering and leave the DOM unstyled.
    - CSS cache: the UI may show old styles; use `?v={{ time() }}` or clear cache/devtools network disable cache during development.
    - Soft deletes: `UserRecord` uses SoftDeletes — do not add force-delete behaviour.
    - Timezone: chat timestamps are formatted using `Asia/Manila` (Philippine time) in the controller; preserve that logic when changing formatting.

  If anything above is missing or you want more examples (tests, accessibility improvements, or step-by-step change recipes), tell me which area to expand and I will update this file.
  ```
