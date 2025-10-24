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
  - Routes: `routes/web.php`
  - Controller: `app/Http/Controllers/UserAjaxController.php`
  - Model: `app/Models/UserRecord.php` (uses SoftDeletes)
  - Views: `resources/views/welcome.blade.php` and modal partials in `resources/views/modal/`
  - Frontend JS: `public/js/crud.js` (main) and `public/js/upload.js` (XHR progress API)
  - Styles: `public/css/crud.css` (ALL CSS must live here — no inline CSS allowed)

- Conventions & important invariants (don't change lightly)
  - NO INLINE CSS/JS: All styles under `public/css/` and scripts under `public/js/`.
  - Modals live under `resources/views/modal/` and are referenced by modal ids: `modal-create`, `modal-edit`, `modal-view`, `modal-trash-confirm`, `modal-image`.
  - JS relies on stable DOM selectors/data-attributes. If you rename anything, update `public/js/crud.js` accordingly. Key selectors:
    - Table body: #crud-table-body
    - Pagination: #crud-pagination, info: #crud-pagination-info
    - Per-page: data-perpage-toggle, data-perpage-dropdown, .perpage-item, #perpage-label
    - Search: data-search-input, data-search-btn
    - Gear menu: data-gear-toggle, data-gear-dropdown, gear items use data-action
    - Selection: row checkboxes (data-row-check), select-all (data-select-all)
    - Upload: global progress #upload-progress-component; create local progress #create-upload-local; hidden path input #create-image-path

- Data & API patterns
  - `public/js/crud.js` uses an `apiFetch` wrapper that sets `Accept: application/json` and attaches `X-CSRF-TOKEN` for mutating requests. It throws an Error with `err.type === 'validation'` and `err.payload` for 422 responses. Use this pattern when adding new AJAX calls.
  - Upload flow: client calls POST `/users/upload` (XHR via `window.uploadProgress.upload`) which returns `{ path, url }`. The create/update endpoints accept `image_path` (string) so images may be uploaded first, then the form submitted with `image_path`.
  - Server-side validation uses the regex `/^[A-Za-z]+$/` for `firstname` and `lastname`. Client-side mirrors this in `crud.js` (NAME_REGEX).
  - Soft deletes only: `UserRecord` uses `SoftDeletes`. Do not add force-delete endpoints.

- Developer workflows & useful commands (PowerShell)
  - Install/build frontend (if editing assets):
    ```powershell
    npm install
    npm run dev
    ```
  - Laravel setup and common tasks:
    ```powershell
    php artisan migrate
    php artisan storage:link
    php artisan serve
    php artisan test   # run test suite
    ```

- Quick change recipe (example: add a new `phone` field)
  1. Add column in a new migration and migrate.
  2. Add `phone` to `$fillable` in `app/Models/UserRecord.php`.
  3. Add server validation in `UserAjaxController::store` and `update` (and adjust client regex if needed).
  4. Update Blade form partials in `resources/views/modal/create.blade.php` and `edit.blade.php` and add `data-error-for="phone"` element.
  5. Update `public/js/crud.js` to render the new column in `renderRows` and wire client validation (data-validate) if required.

- Risks & gotchas
  - Do not rename modal ids, data attributes, or the upload endpoint without updating `crud.js` and `upload.js` — the UI will break silently.
  - CSS must remain in `public/css/crud.css`; editing markup may require small CSS updates but avoid inline styles.
  - The frontend depends on `meta[name="csrf-token"]` for uploads and `apiFetch` headers.

If anything above is unclear or you want a different emphasis (tests, accessibility, or expanding examples), say which area to expand and I will update this file.
