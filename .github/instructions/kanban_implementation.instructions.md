## Laravel Kanban Task Management — Implementation Instructions

Goal: Create a Trello-like Kanban system inside a Laravel 11 app using Tailwind CSS and Alpine.js. This instruction document provides complete, copy-paste-ready files (migrations, models, controller, routes, Blade view + JS) so you can add the feature to your repo quickly.

Notes before you begin
- These instructions assume you have a standard Laravel 11 project with a `users` table and authentication available.
- Tailwind should be installed in your application. If you don't have Tailwind yet, run `npm install` and `npm run dev` per your project setup.
- The Kanban view uses SortableJS (CDN) for drag-and-drop and Alpine.js for UI state.

Files and sections included below (copy each code block into the indicated file path):

1) Database Migrations
  - database/migrations/2025_01_01_000001_create_projects_table.php
  - database/migrations/2025_01_01_000002_create_boards_table.php
  - database/migrations/2025_01_01_000003_create_tasks_table.php
  - database/migrations/2025_01_01_000004_create_subtasks_table.php

2) Eloquent Models
  - app/Models/Project.php
  - app/Models/Board.php
  - app/Models/Task.php
  - app/Models/Subtask.php

3) Controller & Routes
  - app/Http/Controllers/KanbanController.php
  - routes/web.php snippets to add

4) View (Blade + Tailwind + Alpine.js)
  - resources/views/projects/kanban.blade.php

5) Quick commands to migrate & seed

---

SECTION 1 — MIGRATIONS

Create the following migration files using `php artisan make:migration` or paste these into the filenames shown.

File: database/migrations/2025_01_01_000001_create_projects_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('projects');
    }
};
```

File: database/migrations/2025_01_01_000002_create_boards_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('boards');
    }
};
```

File: database/migrations/2025_01_01_000003_create_tasks_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending');
            $table->dateTime('due_date')->nullable();
            $table->dateTime('start_date')->nullable();
            $table->integer('time_spent_seconds')->default(0);
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tasks');
    }
};
```

File: database/migrations/2025_01_01_000004_create_subtasks_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('subtasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subtasks');
    }
};
```

---

SECTION 2 — ELOQUENT MODELS

File: app/Models/Project.php
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'description', 'is_archived'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function boards()
    {
        return $this->hasMany(Board::class)->orderBy('order');
    }
}
```

File: app/Models/Board.php
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Board extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'name', 'order'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class)->orderBy('order');
    }
}
```

File: app/Models/Task.php
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id', 'title', 'description', 'status', 'due_date', 'start_date', 'time_spent_seconds', 'order'
    ];

    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    public function subtasks()
    {
        return $this->hasMany(Subtask::class)->orderBy('order');
    }
}
```

File: app/Models/Subtask.php
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subtask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id', 'title', 'is_completed', 'order'
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
```

---

SECTION 3 — CONTROLLER & ROUTES

Add routes to `routes/web.php` (inside an `auth` middleware group if desired):

```php
use App\Http\Controllers\KanbanController;

Route::middleware(['auth'])->group(function () {
    Route::get('/projects', [KanbanController::class, 'index'])->name('projects.index');
    Route::get('/projects/{project}', [KanbanController::class, 'show'])->name('projects.show');
    Route::post('/tasks/reorder', [KanbanController::class, 'updateTaskPosition'])->name('tasks.reorder');
});
```

Controller: app/Http/Controllers/KanbanController.php
```php
<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\Board;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

class KanbanController extends Controller
{
    public function index()
    {
        // projects for dashboard
        $projects = Project::withCount('boards')->orderBy('created_at', 'desc')->get();

        return view('projects.index', compact('projects'));
    }

    public function show(Project $project)
    {
        // load boards and tasks
        $project->load(['boards' => function ($q) {
            $q->orderBy('order');
        }, 'boards.tasks' => function ($q) {
            $q->orderBy('order');
        }]);

        return view('projects.kanban', ['project' => $project]);
    }

    public function updateTaskPosition(Request $request)
    {
        $data = $request->validate([
            'task_id' => 'required|integer|exists:tasks,id',
            'new_board_id' => 'required|integer|exists:boards,id',
            'new_order' => 'required|integer|min:1'
        ]);

        $task = Task::findOrFail($data['task_id']);

        DB::transaction(function () use ($task, $data) {
            $oldBoardId = $task->board_id;
            $oldOrder = $task->order;
            $newBoardId = (int) $data['new_board_id'];
            $newOrder = (int) $data['new_order'];

            // bump positions in destination board
            Task::where('board_id', $newBoardId)
                ->where('order', '>=', $newOrder)
                ->increment('order');

            // move task
            $task->board_id = $newBoardId;
            $task->order = $newOrder;
            $task->save();

            // compact the old board orders
            Task::where('board_id', $oldBoardId)
                ->orderBy('order')
                ->get()
                ->each(function ($t, $i) {
                    $pos = $i + 1;
                    if ($t->order != $pos) {
                        $t->order = $pos;
                        $t->save();
                    }
                });
        });

        return response()->json(['ok' => true]);
    }
}
```

---

SECTION 4 — VIEW (Blade + Tailwind + Alpine.js + SortableJS)

File: resources/views/projects/kanban.blade.php
```blade
@extends('layouts.app')

@section('content')
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<div class="p-6" x-data="kanbanApp()" x-init="init()" x-cloak>
    <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ $project->name }} — Kanban</h1>
        <div>
            <a href="{{ route('projects.index') }}" class="text-sm text-indigo-600">Back to Projects</a>
        </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
        @foreach($project->boards as $board)
            <div class="bg-gray-100 dark:bg-gray-800 rounded p-3">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-gray-700 dark:text-gray-200">{{ $board->name }}</h3>
                    <span class="text-xs text-gray-500">{{ $board->tasks->count() }}</span>
                </div>
                <div class="space-y-3" id="board-{{ $board->id }}" data-board-id="{{ $board->id }}">
                    @foreach($board->tasks as $task)
                        <div class="bg-white dark:bg-gray-700 p-3 rounded shadow kanban-card" data-task='@json($task)'>
                            <div class="font-medium text-gray-800 dark:text-gray-100">{{ $task->title }}</div>
                            <div class="text-xs text-gray-500">{{ optional($task->due_date)->format('M d') ?? '' }}</div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endforeach
    </div>

    <!-- Task modal -->
    <div x-show="modalOpen" x-cloak class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black opacity-50" @click="closeModal()"></div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 z-10 w-1/2">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white" x-text="modalTask.title"></h2>
            <p class="mt-2 text-gray-600 dark:text-gray-300" x-text="modalTask.description"></p>

            <div class="mt-4">
                <h4 class="font-semibold">Checklist</h4>
                <template x-for="(sub, i) in modalTask.subtasks" :key="sub.id">
                    <div class="flex items-center gap-3 mt-2">
                        <input type="checkbox" class="rounded" :checked="sub.is_completed" @change="toggleSubtask(sub, i)">
                        <div x-text="sub.title" class="text-gray-700 dark:text-gray-200"></div>
                    </div>
                </template>
            </div>

            <div class="mt-6 flex justify-end">
                <button class="px-4 py-2 bg-gray-200 rounded" @click="closeModal()">Close</button>
            </div>
        </div>
    </div>

</div>

<!-- Load SortableJS -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
<!-- Alpine.js (ensure you have Alpine available) -->
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.10.3/dist/cdn.min.js" defer></script>

<script>
function kanbanApp() {
    return {
        modalOpen: false,
        modalTask: {},

        init() {
            // initialize Sortable on each board column
            document.querySelectorAll('[id^="board-"]').forEach(el => {
                new Sortable(el, {
                    group: 'kanban',
                    animation: 150,
                    onEnd: (evt) => {
                        const item = evt.item;
                        const task = JSON.parse(item.getAttribute('data-task'));
                        const newBoardId = evt.to.closest('[data-board-id]').dataset.boardId;
                        const newOrder = Array.from(evt.to.children).indexOf(item) + 1;

                        // send reorder request
                        fetch("{{ route('tasks.reorder') }}", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': '{{ csrf_token() }}'
                            },
                            body: JSON.stringify({ task_id: task.id, new_board_id: newBoardId, new_order: newOrder })
                        }).then(r => r.json()).then(json => {
                            if (!json.ok) location.reload();
                        }).catch(() => location.reload());
                    }
                });
            });

            // cards open modal
            document.querySelectorAll('.kanban-card').forEach(c => {
                c.addEventListener('click', (e) => {
                    const t = JSON.parse(c.getAttribute('data-task'));
                    this.openModal(t);
                });
            });
        },

        openModal(task) {
            this.modalTask = task;
            // fetch subtasks via API optionally; if included in task JSON, use it
            if (!this.modalTask.subtasks) this.modalTask.subtasks = [];
            this.modalOpen = true;
        },

        closeModal() {
            this.modalOpen = false;
        },

        toggleSubtask(sub, idx) {
            // optimistic UI — send small request to toggle on server (not implemented here)
            sub.is_completed = !sub.is_completed;
        }
    }
}
</script>
```

---

SECTION 5 — RUN MIGRATIONS & QUICK TEST

Commands:
```bash
php artisan migrate
# Optional: add a demo project manually or create a seeder
php artisan serve
```

Open: `http://127.0.0.1:8000/projects/{project_id}` and test drag-and-drop. The board will call `/tasks/reorder` when you move cards; the controller updates DB within a transaction.

---

Notes and next steps
- This instruction uses SortableJS for reliability; if you prefer a purely Alpine-driven drag/drop (Alpine Draggable), I can provide an alternative.
- I kept server-side logic minimal and safe — position reindexing is performed in the controller transaction to avoid duplicate order numbers. For heavy concurrent load, consider job queueing or optimistic locking.
- You can extend this with API endpoints, WebSockets (Laravel Echo + Pusher) for realtime updates, and per-user permissions.

If you'd like I can also create the actual files in your repository now (apply them with proper filenames and run `php artisan migrate`), or produce a git patch you can apply. Tell me which you prefer.
