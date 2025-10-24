applyTo: '**'
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.
---
applyTo: '**'
---

# Auth setup instructions (for automated agent / developer)

The following are step-by-step instructions to add a simple authentication flow into the project. Only edit the files listed below when implementing these changes. If your environment already has migrations applied, prefer adding a new migration (see notes below) instead of editing historic migrations.

Tasks to add (high level)
- Create `app/Http/Controllers/AuthController.php` (login, logout, showLogin)
- Ensure `app/Http/Middleware/Authenticate.php` exists (create if missing)
- Create `resources/views/auth/login.blade.php`
- Update or create migration to use `username` instead of `name` on `users` table
- Add routes for login/logout and protect CRUD routes with `auth` middleware
- Add frontend AJAX login (`public/js/login.js`) and logout (`public/js/logout.js`) files

Detailed instructions and references

1) Controller: `app/Http/Controllers/AuthController.php`

Create this controller with the following reference implementation. The controller returns JSON responses for the AJAX frontend.

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
	public function showLogin()
	{
		return view('auth.login');
	}

	public function login(Request $request)
	{
		$credentials = $request->validate([
			'email' => 'required|email',
			'password' => 'required'
		]);

		if (Auth::attempt($credentials)) {
			$request->session()->regenerate();
			return response()->json(['success' => true, 'message' => 'Login successful']);
		}

		return response()->json(['success' => false, 'message' => 'Invalid credentials']);
	}

	public function logout(Request $request)
	{
		Auth::logout();
		$request->session()->invalidate();
		$request->session()->regenerateToken();

		return response()->json(['success' => true, 'message' => 'Logged out']);
	}
}
```

2) Middleware

- Confirm `app/Http/Middleware/Authenticate.php` exists. If it does not, create a minimal middleware that behaves like Laravel's default:
  - If the request expects JSON (AJAX/fetch), return `response()->json(['message' => 'Unauthenticated'], 401)`.
  - Otherwise redirect to the named `login` route: `redirect()->guest(route('login'))`.

3) View: `resources/views/auth/login.blade.php`

- Create a Blade view for the login page. Include a normal `<form id="loginForm">` with `@csrf` and inputs for `email` and `password`.
- Do NOT put inline JS/CSS. Include `public/css/login.css` and `public/js/login.js` using `asset()`.

4) Migration change (users table)

- Edit `database/migrations/2014_10_12_000000_create_users_table.php` to rename the `name` column to `username`.

Replace:
```php
$table->string('name');
```
With:
```php
$table->string('username');
```

Important: If your database is already migrated in any environment, do NOT edit historic migrations. Instead create a new migration that renames the column:

```php
Schema::table('users', function (Blueprint $table) {
	$table->renameColumn('name', 'username');
});
```

5) Routes (routes/web.php)

Add the auth routes and protect the CRUD with `auth` middleware. Example:

```php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AjaxCrudController;

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');

Route::middleware('auth')->group(function () {
	Route::get('/', [AjaxCrudController::class, 'index'])->name('crud.index');
	// AJAX CRUD endpoints (index/store/show/update/delete) exist under this group
});
```

6) Front-end protection snippet

In Blade templates that should only be visible to authenticated users use:

```blade
@if(Auth::check())
	{{-- Load your CRUD table here --}}
@else
	<script>window.location.href = '/login';</script>
@endif
```

7) Logout button and JS

Place logout JS in `public/js/logout.js` and include it in your layout.

Example markup (no inline JS/CSS):

```html
<button id="logoutBtn" class="text-gray-600 hover:text-red-500"><i class="fas fa-sign-out-alt"></i> Logout</button>
```

`public/js/logout.js`:

```javascript
document.getElementById('logoutBtn').addEventListener('click', async () => {
	const response = await fetch('/logout', {
		method: 'POST',
		headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }
	});
	const data = await response.json();
	if (data.success) {
		// show toast if available then redirect
		setTimeout(() => window.location.href = '/login', 1000);
	}
});
```

8) AJAX login script (`public/js/login.js`)

Create `public/js/login.js` with the following pattern (reads CSRF from hidden input or meta tag):

```javascript
document.addEventListener("DOMContentLoaded", () => {
	const loginForm = document.getElementById("loginForm");

	loginForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const formData = new FormData(loginForm);

		try {
			const response = await fetch("/login", {
				method: "POST",
				headers: { "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content },
				body: formData,
			});

			const data = await response.json();

			if (data.success) {
				// show toast then redirect
				setTimeout(() => { window.location.href = "/"; }, 800);
			} else {
				// show error
			}
		} catch (error) {
			console.error("Login failed:", error);
		}
	});
});
```

9) No inline CSS/JS policy reminder

Always add styles to `public/css/*.css` and scripts to `public/js/*.js` and include them with `asset()` in Blade. Do not add inline script or style attributes.

10) Testing and notes

- Manual test plan: visit `/login`, attempt valid/invalid logins, confirm redirect to `/` and access to CRUD, click logout and confirm redirect to `/login`.
- If images or other resources are loaded from external domains, ensure CORS headers if needed for AJAX or PDF generation.

If you want, I can implement any subset of the tasks above now (create controller, create view, add JS files, add middleware, or create a migration to rename `name` -> `username`).

Specify which of the tasks you'd like me to perform and I'll implement them and run quick verification steps.
