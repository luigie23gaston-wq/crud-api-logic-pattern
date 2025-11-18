<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

use App\Http\Controllers\CrudController;
use App\Http\Controllers\UserAjaxController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\Admin\WeatherHistoryController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;

// Public authentication routes (must remain public so middleware can redirect here)
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');

// Public entry: login routes above; protect the CRUD surface behind auth middleware
Route::middleware('auth')->group(function () {
    Route::get('/', [CrudController::class, 'index'])->name('crud.index');

    // Weather app (protected)
    Route::get('/weather', [WeatherController::class, 'index'])->name('weather.index');
    // Friendly GET handler for the fetch endpoint to return JSON instead of an HTML error when visited by GET
    Route::get('/weather/fetch', function () {
        return response()->json([
            'ok' => false,
            'message' => 'The GET method is not supported for this endpoint. Use POST /weather/fetch with { city }.'
        ], 405);
    });
    Route::post('/weather/fetch', [WeatherController::class, 'fetch'])->name('weather.fetch');

    // AJAX CRUD routes for users (JSON)
    Route::get('/users', [UserAjaxController::class, 'index']);
    Route::post('/users', [UserAjaxController::class, 'store']);
    Route::post('/users/upload', [UserAjaxController::class, 'upload']);
    // only accept numeric IDs for update to avoid catching named endpoints like /users/restore
    Route::post('/users/{id}', [UserAjaxController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/users', [UserAjaxController::class, 'trash']);
    // Trashed / archive endpoints (register before parameterized routes to avoid collisions)
    Route::get('/users/trashed', [UserAjaxController::class, 'trashed']);
    // Friendly GET handler so navigating to this URL returns a helpful JSON message
    Route::get('/users/restore', function () {
        return response()->json(['message' => 'This endpoint accepts POST requests with { ids: [] } to restore soft-deleted records. Use POST /users/restore.'], 405);
    });
    Route::post('/users/restore', [UserAjaxController::class, 'restore']);

    // only match numeric IDs so that /users/trashed and other named endpoints are not captured
    Route::get('/users/{id}', [UserAjaxController::class, 'show'])->where('id', '[0-9]+');

    // Admin history (weather) - lightweight CRUD for history (protect in production)
    Route::prefix('admin')->group(function () {
        Route::get('/history', [WeatherHistoryController::class, 'index'])->name('admin.history');
        Route::delete('/history/{weatherSearch}', [WeatherHistoryController::class, 'destroy'])->name('admin.history.destroy');
        Route::post('/history/clear', [WeatherHistoryController::class, 'clearAll'])->name('admin.history.clear');
        // lightweight JSON endpoint for frontend history rendering
        Route::get('/history-data', function () {
            return response()->json([
                'ok' => true,
                'data' => \App\Models\WeatherSearch::select('city','country')->latest()->limit(12)->get()
            ]);
        });
    });
    
    // Project Task view (placeholder for Kanban / project tasks)
    Route::get('/project-task', function () {
        return view('project_task');
    })->name('project.task');
    
    // Project management JSON endpoints (AJAX)
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/{id}', [ProjectController::class, 'show'])->name('projects.show');
    Route::put('/projects/{id}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    // Task Board for each project
    Route::get('/tasks/{project}', [TaskController::class, 'show'])->name('tasks.show');
    
    // Task sections management
    Route::get('/tasks/{project}/sections', [TaskController::class, 'getSections'])->name('tasks.getSections');
    Route::post('/tasks/{project}/sections', [TaskController::class, 'storeSection'])->name('tasks.storeSection');
    Route::post('/tasks/{project}/sections/reorder', [TaskController::class, 'reorderSections'])->name('tasks.reorderSections');
    Route::post('/tasks/{project}/sections/{section}', [TaskController::class, 'updateSection'])->name('tasks.updateSection');
    Route::post('/tasks/{project}/sections/{section}/reorder-items', [TaskController::class, 'reorderSectionItems'])->name('tasks.reorderSectionItems');
    Route::delete('/tasks/{project}/sections/{section}', [TaskController::class, 'destroySection'])->name('tasks.destroySection');
    
    // Task items management
    Route::get('/tasks/{project}/items', [TaskController::class, 'getItems'])->name('tasks.getItems');
    Route::post('/tasks/{project}/items', [TaskController::class, 'storeItem'])->name('tasks.storeItem');
    Route::post('/tasks/{project}/items/{taskItem}', [TaskController::class, 'updateItem'])->name('tasks.updateItem');
    Route::delete('/tasks/{project}/items/{taskItem}', [TaskController::class, 'destroyItem'])->name('tasks.destroyItem');
    Route::post('/tasks/{project}/reorder', [TaskController::class, 'reorderItems'])->name('tasks.reorder');

    // Subtask management for task items
    Route::get('/tasks/{project}/items/{taskItem}/subtasks', [TaskController::class, 'getSubtasks'])->name('tasks.getSubtasks');
    Route::post('/tasks/{project}/items/{taskItem}/subtasks', [TaskController::class, 'storeSubtask'])->name('tasks.storeSubtask');
    Route::post('/tasks/{project}/items/{taskItem}/subtasks/{subtask}', [TaskController::class, 'updateSubtask'])->name('tasks.updateSubtask');
    Route::post('/tasks/{project}/items/{taskItem}/subtasks/{subtask}/toggle', [TaskController::class, 'toggleSubtask'])->name('tasks.toggleSubtask');
    Route::delete('/tasks/{project}/items/{taskItem}/subtasks/{subtask}', [TaskController::class, 'destroySubtask'])->name('tasks.destroySubtask');
    Route::post('/tasks/{project}/items/{taskItem}/subtasks/reorder', [TaskController::class, 'reorderSubtasks'])->name('tasks.reorderSubtasks');
});


// Friendly GET handler so navigating to this URL returns a helpful JSON message
Route::get('/users/restore', function () {
    return response()->json(['message' => 'This endpoint accepts POST requests with { ids: [] } to restore soft-deleted records. Use POST /users/restore.'], 405);
});

// Global Chat Routes - Real Database Implementation (inside auth middleware for protection)
Route::middleware('auth')->group(function () {
    Route::get('/chat/messages', [ChatController::class, 'index'])->name('chat.messages');
    Route::post('/chat/messages', [ChatController::class, 'store'])->name('chat.send');
    Route::post('/chat/upload', [ChatController::class, 'uploadAttachment'])->name('chat.upload');
});

