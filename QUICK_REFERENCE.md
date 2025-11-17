# Task Modal - Quick Reference Card

## API Endpoints

```
GET    /tasks/{projectId}                    Show task board
GET    /tasks/{projectId}/items              Fetch all tasks
POST   /tasks/{projectId}/items              Create task
POST   /tasks/{projectId}/items/{taskId}     Update task
DELETE /tasks/{projectId}/items/{taskId}     Delete task
POST   /tasks/{projectId}/reorder            Reorder tasks
```

## Modal States

```
CREATE MODE                  EDIT MODE
─────────────────────────────────────────────────────
editingTask: null           editingTask: { task obj }
showModal: true             showModal: true
modalForm: {                modalForm: {
  title: '',                  title: 'Edit this',
  progress: 0,                progress: 45,
  date: '0%',                 date: '2025-01-20',
  subtasks: '0/0'             subtasks: '2/5'
}                           }
selectedColumn: 'eicaer'    selectedColumn: 'eicaer'
Button text: "Create Task"  Button text: "Save Changes"
```

## Event Triggers

```
EVENT                           METHOD CALLED
────────────────────────────────────────────────────
Click "+ Add Task"    ────→  showAddModal(column)
Click task card       ────→  editTask(task)
Click "Create/Save"   ────→  saveTask()
Click "Cancel" or "X" ────→  closeModal()
Click trash icon      ────→  deleteTask(taskId)
Drag task to column   ────→  dragStart/drop()
Click backdrop        ────→  closeModal()
```

## Form Validation

```
FIELD          VALIDATION                 ERROR MESSAGE
────────────────────────────────────────────────────────
Title          required, max 255 chars    "Task title is required"
Progress       0-100 (integer)            Enforced by range input
Column         enum (6 values)            Server-side validation
Date           optional string            No validation
Subtasks       optional string            No validation
```

## Common Code Patterns

### Create a New Task
```javascript
// User clicks "+ Add Task" button
@click="showAddModal('eicaer')"

// Modal opens with empty form
// User fills: title="Deploy API"
// User clicks "Create Task"

// saveTask() sends:
POST /tasks/1/items
{
  title: "Deploy API",
  column: "eicaer",
  progress: 0,
  alt_progress: 0,
  subtasks: "0/0",
  date: ""
}
```

### Edit an Existing Task
```javascript
// User clicks task card
@click="editTask(task)"

// Modal opens with pre-filled data
// Existing: title="Fix Bug", progress: 50

// User changes: progress: 75
// User clicks "Save Changes"

// saveTask() sends:
POST /tasks/1/items/42
{
  title: "Fix Bug",
  column: "eicaer",
  progress: 75,
  alt_progress: 75,
  subtasks: "0/0",
  date: ""
}
```

### Delete Task with Confirmation
```javascript
// User clicks trash icon
@click.stop="deleteTask(task.id)"

// Confirmation dialog: "Are you sure?"
if (confirm()) {
  DELETE /tasks/1/items/42
  // Remove from local array
  // Refresh board
}
```

## HTML Structure

```html
<!-- Task Card (Clickable) -->
<div @click="editTask(task)" @dragstart="dragStart()" draggable="true">
  <div @click.stop="deleteTask(task.id)">
    <i class="fas fa-trash"></i>
  </div>
</div>

<!-- Modal (Alpine) -->
<div x-show="showModal">
  <form @submit.prevent="saveTask()">
    <input x-model="modalForm.title" required>
    <input x-model="modalForm.progress" type="range">
    <input x-model="modalForm.date">
    <input x-model="modalForm.subtasks">
    <button type="submit">Create/Save</button>
  </form>
</div>
```

## JavaScript State

```javascript
taskManager_instance = {
  projectId: 1,
  showModal: false,
  editingTask: null,
  selectedColumn: 'eicaer',
  modalForm: { title, progress, date, subtasks },
  tasks: {
    eicaer: [],
    eihom: [],
    userAccess: [],
    dialoging: [],
    testing: [],
    notifications: []
  }
}
```

## Console Debugging

```javascript
// Get current state
taskManager_instance

// Check if modal is open
taskManager_instance.showModal

// View all tasks
taskManager_instance.tasks

// View form data
taskManager_instance.modalForm

// Open modal manually
taskManager_instance.showAddModal('eicaer')

// Close modal
taskManager_instance.closeModal()

// Show test toast
taskManager_instance.showToast('Test message')
```

## CSS Classes

```
Modal:         fixed inset-0 bg-black bg-opacity-50 z-50
Modal Box:     bg-white rounded-xl p-6 shadow-2xl
Form Inputs:   w-full border rounded-lg px-4 py-2
Focus State:   focus:border-purple-500 focus:ring-2
Buttons:       px-4 py-2 rounded-lg font-medium
Task Cards:    cursor-pointer hover:shadow-md
```

## Response Formats

### Create Task (201 Created)
```json
{
  "ok": true,
  "item": {
    "id": 42,
    "project_id": 1,
    "title": "Deploy API",
    "column": "eicaer",
    "progress": 0,
    "alt_progress": 0,
    "subtasks": "0/0",
    "date": "",
    "order": 1,
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
}
```

### Update Task (200 OK)
```json
{
  "ok": true,
  "item": {
    "id": 42,
    "project_id": 1,
    "title": "Deploy API",
    "column": "eicaer",
    "progress": 75,
    "alt_progress": 75,
    "subtasks": "0/0",
    "date": "",
    "order": 1,
    "updated_at": "2025-01-20T10:35:00Z"
  }
}
```

### Error (422 Unprocessable Entity)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "title": ["The title field is required."],
    "column": ["The column must be one of: eicaer, eihom, ..."]
  }
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Modal doesn't appear | Check `showModal` in console |
| Can't type in form | Verify `x-model` bindings exist |
| Save doesn't work | Check Network tab, CSRF token |
| Task doesn't update | Check response in Network tab |
| Drag-drop broken | Verify `@dragstart` and `@drop` |
| Styling looks wrong | Clear cache (Ctrl+Shift+Delete) |
| Delete button errors | Check `@click.stop` attribute |
| Toast doesn't show | Check z-index and DOM insertion |

## Performance Tips

```javascript
// Good: Minimal re-renders
x-show="showModal"      // Fast toggle
x-model="field"         // Only updates changed field

// Avoid: Heavy re-renders
x-if="showModal"        // Re-mounts entire component
Multiple nested loops   // Use flat structure

// Optimize: Cache API calls
// Load tasks once on init
// Update locally on changes
// Refresh on demand only
```

## Security Checklist

- [x] CSRF token included in all requests
- [x] Authorization checks on server
- [x] Input validation on client and server
- [x] Proper HTTP methods (GET, POST, DELETE)
- [x] No sensitive data in URLs
- [x] XSS protection (Alpine auto-escapes)
- [x] CORS headers configured
- [x] Rate limiting on endpoints

## Browser Compatibility

```
Chrome:   ✅ Full support
Firefox:  ✅ Full support
Safari:   ✅ Full support
Edge:     ✅ Full support
IE11:     ❌ Not supported
Mobile:   ✅ Full support
```

## File References

```
View:      resources/views/task.blade.php
Logic:     public/js/task.js
API:       app/Http/Controllers/TaskController.php
Model:     app/Models/TaskItem.php
Routes:    routes/web.php (lines 91-96)
Migration: database/migrations/2025_11_14_000001_...
```

## Column Names

```
1. eicaer       (eICAER 4th Quarter)
2. eihom        (eIHOM 41th Quarter)
3. userAccess   (User Access Settings)
4. dialoging    (Dialoging)
5. testing      (Testing)
6. notifications (Notifications)
```

## Keyboard Shortcuts (Future)

```
Escape     Close modal
Tab        Next field
Shift+Tab  Previous field
Enter      Submit (in text fields)
```

## Toast Notification Settings

```
Duration:     2500ms (configurable)
Position:     top-right (fixed)
Color:        bg-green-500 (success)
Z-index:      z-50 (above modal)
Text:         white color
Padding:      px-6 py-3
Border-radius: rounded-lg
Shadow:       shadow-lg
```

## Common Tasks Checklist

- [ ] Display task board: `@include('task')`
- [ ] Create task: Click "+ Add Task" → Fill form → Save
- [ ] Edit task: Click card → Modify → Save
- [ ] Delete task: Click trash → Confirm → Done
- [ ] Move task: Drag to column → Drop
- [ ] View tasks: Load board → Fetch from API
- [ ] Refresh board: `loadTasks()` method

---

**Quick Reference Version:** 1.0
**Last Updated:** January 2025
**Status:** Ready for Production
