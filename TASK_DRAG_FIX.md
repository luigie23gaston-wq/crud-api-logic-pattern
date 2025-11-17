# Task Card Drag-and-Drop Fix

## Problem
Alpine.js was showing "task is not defined" errors when task cards were dragged. The issue was that SortableJS physically moves DOM elements, breaking Alpine's reactive `x-for` context.

## Root Cause
1. SortableJS manipulated DOM directly
2. Alpine's `x-for="task in section.task_items"` lost reference to the moved elements
3. `task.subtasks` was sometimes a string instead of an array
4. No synchronization between DOM order and Alpine's data

## Solution Implemented

### 1. Added taskSortables Tracking (task.js line 12)
```javascript
taskSortables: [],  // Track task card sortable instances
```

### 2. Fixed loadSections (task.js ~line 113)
- Parses `task.subtasks` to always be an array
- Handles string, array, and null cases
- Increased timeout to 300ms for Alpine rendering

### 3. Rewrote initTaskCardSortables (task.js ~line 214)
Key changes:
- Wrapped in `$nextTick()` to wait for Alpine
- Destroys old sortables before creating new ones
- Updates Alpine's data array in `onEnd` handler:
  ```javascript
  fromSection.task_items.splice(oldIndex, 1);
  toSection.task_items.splice(newIndex, 0, movedTask);
  self.sections = [...self.sections];  // Force reactivity
  ```

## How It Works
1. User drags task card
2. SortableJS moves DOM element
3. `onEnd` handler fires
4. Handler updates Alpine's `sections` array to match DOM
5. Alpine re-renders with correct data binding
6. Backend updated if moved to different section

## Testing
1. Refresh browser (Ctrl+F5)
2. Drag task cards up/down within sections
3. Drag task cards between sections
4. Check console - should see:
   - "🎯 Initializing task card sortables"
   - "✅ Task card sortables initialized: X"
   - "📋 Task card drag ended"
5. No Alpine errors

## Next Steps
- Test subtask drag (user reported not functional)
- Add backend persistence for within-section reordering
- Consider adding visual drag handles for better UX
