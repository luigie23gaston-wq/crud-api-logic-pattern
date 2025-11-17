# Task Modal - Visual Guide

## Modal State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Task Board (task.blade.php)             │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  eicaer Column  │  │  eihom Column   │  ...             │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │                 │
│  │ │  Task Card  │ │  │ │  Task Card  │ │                 │
│  │ │ (clickable) │────┼─│ (clickable) │ │                 │
│  │ └─────────────┘ │  │ └─────────────┘ │                 │
│  │      ↓          │  │      ↓          │                 │
│  │  + Add Task  │  │  │  + Add Task  │  │                 │
│  │   (button)   │  │  │   (button)   │  │                 │
│  └─────────────────┘  └─────────────────┘                 │
│         ↓                    ↓                              │
│    editTask(task)      showAddModal()                      │
│         ↓                    ↓                              │
│    ┌────────────────────────────────────────┐              │
│    │   Alpine Modal Component (x-show)      │              │
│    │   showModal = true                     │              │
│    │   editingTask = task object            │              │
│    │   selectedColumn = 'eicaer'            │              │
│    │   modalForm = { ... }                  │              │
│    │                                        │              │
│    │  [X] Create New Task / Edit Task       │              │
│    │  ─────────────────────────────────     │              │
│    │  Task Title: [input] x-model           │              │
│    │  Progress: [range] @input              │              │
│    │  Date/Info: [input] x-model            │              │
│    │  Subtasks: [input] x-model             │              │
│    │                                        │              │
│    │  [Cancel]  [Create/Save Changes]       │              │
│    │   @click      @submit.prevent          │              │
│    │   closeModal  saveTask()               │              │
│    └────────────────────────────────────────┘              │
│         ↓                    ↓                              │
│    closeModal()          saveTask()                        │
│    showModal=false      (POST/PUT)                         │
│    modalForm={}         ↓                                  │
│                    Task saved in DB                        │
│                    Modal closes                            │
│                    Toast notification                      │
│                    UI updates                              │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow Diagram

```
User Interaction          Alpine.js Handler        JavaScript Method      Database
─────────────────────────────────────────────────────────────────────────────

Click "Add Task"  ──────→  @click               ──→  showAddModal()     ──→ N/A
                           :showModal=true
                           :editingTask=null

Click Task Card   ──────→  @click               ──→  editTask(task)     ──→ N/A
                           :showModal=true
                           :editingTask=task

Fill Form         ──────→  x-model              ──→  modalForm.*        ──→ N/A
                           (title, progress...)

Submit Form       ──────→  @submit.prevent      ──→  saveTask()         ──→ POST/PUT
                                                    :validateForm
                                                    :showToast
                                                    :closeModal

Delete Task       ──────→  @click.stop          ──→  deleteTask()       ──→ DELETE
                           Trash button              :confirm()

Drag & Drop       ──────→  @dragstart           ──→  dragStart/         ──→ POST
                           @drop                     drop()
                           @dragover                 updateTaskColumn()

Close Modal       ──────→  @click               ──→  closeModal()       ──→ N/A
                           X button or Cancel        :showModal=false
```

## Data Flow: Creating a Task

```
Modal Form State (Alpine.js)
┌────────────────────────────────────┐
│ modalForm: {                       │
│   title: "New Feature",            │
│   progress: 45,                    │
│   date: "2025-01-20",              │
│   subtasks: "2/5"                  │
│ }                                  │
│ editingTask: null (new mode)       │
│ selectedColumn: "eicaer"           │
└────────────────────────────────────┘
           ↓ saveTask()
Payload (JSON)
┌────────────────────────────────────┐
│ {                                  │
│   title: "New Feature",            │
│   column: "eicaer",                │
│   progress: 45,                    │
│   alt_progress: 45,                │
│   subtasks: "2/5",                 │
│   date: "2025-01-20"               │
│ }                                  │
└────────────────────────────────────┘
           ↓ fetch POST
API Response (Laravel)
┌────────────────────────────────────┐
│ {                                  │
│   ok: true,                        │
│   item: {                          │
│     id: 42,                        │
│     project_id: 1,                 │
│     title: "New Feature",          │
│     column: "eicaer",              │
│     progress: 45,                  │
│     alt_progress: 45,              │
│     subtasks: "2/5",               │
│     date: "2025-01-20",            │
│     created_at: "2025-01-20...",   │
│     ...                            │
│   }                                │
│ }                                  │
└────────────────────────────────────┘
           ↓
Update Local State
┌────────────────────────────────────┐
│ tasks.eicaer.push(item)            │
│ → UI auto-updates with x-for       │
│                                    │
│ New task card appears in column    │
└────────────────────────────────────┘
           ↓
Close Modal & Show Toast
┌────────────────────────────────────┐
│ showModal = false                  │
│ showToast("Task created...")       │
│ Toast fades after 2.5s             │
└────────────────────────────────────┘
```

## Data Flow: Editing a Task

```
Click Existing Task Card
│
├─→ editTask(task)
│   │
│   ├─→ editingTask = task (store reference)
│   ├─→ selectedColumn = task.column
│   ├─→ modalForm = {
│   │      title: task.title,
│   │      progress: task.progress,
│   │      date: task.date,
│   │      subtasks: task.subtasks
│   │   }
│   └─→ showModal = true
│
├─→ Modal appears with pre-filled data
│
├─→ User modifies fields
│   └─→ x-model updates modalForm in real-time
│
├─→ Click "Save Changes"
│   └─→ @submit.prevent triggers saveTask()
│
├─→ saveTask() detects edit mode (editingTask !== null)
│   │
│   ├─→ endpoint = `/tasks/{projectId}/items/{taskId}`
│   ├─→ method = 'POST'
│   ├─→ payload includes updated fields
│   └─→ fetch sends request
│
├─→ Laravel TaskController.updateItem()
│   └─→ Updates database record
│
├─→ Response returns updated item
│   └─→ { ok: true, item: { ...updated fields } }
│
├─→ JavaScript updates tasks array
│   │
│   └─→ this.tasks[column][index] = data.item
│
├─→ Alpine.js re-renders task card
│   └─→ Card shows updated title, progress, etc.
│
├─→ Modal closes and shows toast
│   └─→ showToast("Task updated successfully!")
│
└─→ Success! User sees updated card in column
```

## Modal Form Validation

```
User clicks Submit
│
├─→ @submit.prevent="saveTask()"
│   (prevents default form submission)
│
├─→ saveTask() runs
│   │
│   ├─→ Check: modalForm.title.trim() is not empty
│   │   ├─→ YES: Continue to API call
│   │   └─→ NO: Show alert("Task title is required")
│   │        → Return without saving
│   │
│   ├─→ Backend validation via Laravel
│   │   ├─→ title: required|string|max:255
│   │   ├─→ column: required|in:eicaer,eihom,...
│   │   ├─→ progress: integer|min:0|max:100
│   │   └─→ If invalid: Returns 422 response
│   │
│   └─→ On error: console.error() + alert()
│       On success: Update UI + show toast
│
└─→ Modal state persists for corrections
   (Form data remains in modalForm)
```

## Component Interaction Map

```
┌──────────────────────────────────────────────────────────────┐
│                    task.blade.php (View)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Alpine.js Component                                     │ │
│  │  x-data="taskManager()"                                  │ │
│  │  x-init="init()"                                         │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │  State Properties (Reactive)                       │ │ │
│  │  │  • projectId                                       │ │ │
│  │  │  • showModal (boolean)                             │ │ │
│  │  │  • editingTask (object|null)                       │ │ │
│  │  │  • selectedColumn (string)                         │ │ │
│  │  │  • modalForm (object)                              │ │ │
│  │  │  • tasks (object - 6 columns)                      │ │ │
│  │  │  • draggedTask, draggedFrom                        │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │  Methods (Event Handlers & Logic)                  │ │ │
│  │  │  • init() - Load tasks on mount                    │ │ │
│  │  │  • loadTasks() - Fetch from API                    │ │ │
│  │  │  • showAddModal(column)                            │ │ │
│  │  │  • editTask(task)                                  │ │ │
│  │  │  • saveTask()                                      │ │ │
│  │  │  • closeModal()                                    │ │ │
│  │  │  • showToast(message)                              │ │ │
│  │  │  • deleteTask(id)                                  │ │ │
│  │  │  • dragStart/Drop/End()                            │ │ │
│  │  │  • updateTaskColumn()                              │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │  x-show="showModal" (Modal Visibility)                   │ │
│  │  ├─ Form Inputs                                         │ │
│  │  │  ├─ x-model="modalForm.title"                       │ │
│  │  │  ├─ x-model="modalForm.progress"                    │ │
│  │  │  ├─ x-model="modalForm.date"                        │ │
│  │  │  └─ x-model="modalForm.subtasks"                    │ │
│  │  ├─ Submit Button                                       │ │
│  │  │  └─ @submit.prevent="saveTask()"                    │ │
│  │  └─ Close Buttons                                       │ │
│  │     ├─ @click="closeModal()"                           │ │
│  │     └─ @click.stop="deleteTask()"                      │ │
│  │                                                          │ │
│  │  x-for="task in tasks[column]" (Task Cards)            │ │
│  │  ├─ @click="editTask(task)"                            │ │
│  │  ├─ @dragstart="dragStart()"                           │ │
│  │  └─ @drop="drop()"                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         ↓↓↓ API Communication ↓↓↓
┌──────────────────────────────────────────────────────────────┐
│                   Laravel Backend (API)                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  TaskController.php                                      │ │
│  │  • getItems(project) → GET /tasks/{id}/items            │ │
│  │  • storeItem(request, project) → POST /tasks/id/items   │ │
│  │  • updateItem(request, project, item) → POST /{id}/...  │ │
│  │  • destroyItem(project, item) → DELETE /{id}/...        │ │
│  │  • reorderItems(request, project) → POST /{id}/reorder  │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  TaskItem Model                                          │ │
│  │  • Relationships: belongsTo(Project)                    │ │
│  │  • Attributes: title, progress, column, date, etc.      │ │
│  │  • Timestamps & SoftDeletes                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Database: task_items table                             │ │
│  │  • CRUD Operations                                       │ │
│  │  • Foreign key: project_id                              │ │
│  │  • Cascade delete on project removal                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## CSS Classes Used

```
Modal Container:
├─ fixed inset-0 - Full screen overlay
├─ bg-black bg-opacity-50 - Dark backdrop
├─ flex items-center justify-center - Center modal
└─ z-50 - Above all elements

Modal Box:
├─ bg-white - White background
├─ rounded-xl - Rounded corners
├─ p-6 - Padding
├─ max-w-md w-full - Max width and responsive
├─ mx-4 - Horizontal margin
└─ shadow-2xl - Drop shadow

Form Inputs:
├─ w-full - Full width
├─ border border-gray-300 - Border
├─ rounded-lg - Rounded corners
├─ px-4 py-2 - Padding
├─ focus:outline-none - Remove default outline
├─ focus:border-purple-500 - Purple border on focus
└─ focus:ring-2 focus:ring-purple-200 - Focus ring

Buttons:
├─ px-4 py-2 - Padding
├─ rounded-lg - Rounded corners
├─ hover: - Hover state
├─ transition - Smooth transitions
└─ font-medium - Medium font weight

Task Cards:
├─ cursor-pointer - Mouse cursor feedback
├─ hover:shadow-md - Hover shadow effect
├─ draggable="true" - HTML5 drag-drop
└─ transition - Smooth animations
```

## Browser DevTools Debugging

```
In Console:
───────────
// Access taskManager instance
taskManager_instance

// View current state
console.log(taskManager_instance.showModal)
console.log(taskManager_instance.modalForm)
console.log(taskManager_instance.tasks)

// Manually trigger methods
taskManager_instance.showAddModal('eicaer')
taskManager_instance.closeModal()
taskManager_instance.showToast('Test message')

In Network Tab:
──────────────
POST /tasks/1/items
├─ Request: JSON payload with title, progress, etc.
└─ Response: 201 Created with full item object

POST /tasks/1/items/42
├─ Request: JSON with updated fields
└─ Response: 200 OK with updated item object

DELETE /tasks/1/items/42
├─ Request: No body
└─ Response: 200 OK or 204 No Content

In Elements Tab:
────────────────
<div x-show="showModal" x-cloak>
  <form @submit.prevent="saveTask()">
    <input x-model="modalForm.title">
    ...
  </form>
</div>
```

## Keyboard Navigation (Optional Future Enhancement)

```
Escape      → Close modal
Tab         → Navigate between form fields
Shift+Tab   → Navigate backwards
Enter       → Submit form (in text fields)
             (may require custom handling)
```

---

**Visual Guide Created:** January 2025
**Component:** Task Modal Management System
**Status:** ✅ Ready for Testing
