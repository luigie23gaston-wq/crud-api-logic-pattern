# Subtask System - Quick Reference

## How to Use

### Opening Subtasks
1. Go to your task board
2. Find a task card
3. Click the green "Add Subtask" button at the bottom of the card
4. The subtask modal will open

### Adding Subtasks
**Option 1 - Press Enter:**
1. Type the subtask title in the input field
2. Press **Enter** on your keyboard
3. Subtask is added and input clears

**Option 2 - Click Button:**
1. Type the subtask title in the input field
2. Click the green **"Add"** button
3. Subtask is added and input clears

### Managing Subtasks
- **Mark Complete:** Click the checkbox next to a subtask
- **Unmark:** Click the checkbox again to mark incomplete
- **Move Up:** Click the ↑ arrow button to move subtask up one position
- **Move Down:** Click the ↓ arrow button to move subtask down one position
- **Delete:** Click the red trash icon to remove the subtask

### Progress Tracking
- The progress bar at the top shows completion percentage
- Format: "2/5 • 40%" (2 completed out of 5 total, 40% done)
- Progress automatically updates as you check/uncheck items
- Completed items show with a strikethrough

### Closing the Modal
- Click the **X** button in the top right
- Click outside the modal (on the dark background)
- The modal will close and save all changes

## Features

✨ **Real-Time Updates**
- Progress updates instantly as you change subtasks
- All changes automatically saved to the server
- No page refresh needed

✨ **Reordering**
- Drag-like behavior with up/down buttons
- Maintains order when you close and reopen

✨ **Data Persistence**
- All subtasks saved to database
- Survives page refresh
- Available next time you open the task

✨ **User Feedback**
- Green success messages confirm actions
- Error messages if something goes wrong
- Empty state message when no subtasks exist

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Add new subtask (when input focused) |
| **ESC** | Close modal |

## Tips & Tricks

1. **Organize Workflow:** Use subtasks to break down complex tasks into smaller steps
2. **Track Progress:** Check off items as you complete them to see progress bar fill
3. **Reorder Priority:** Move urgent subtasks to the top
4. **Use Descriptive Names:** Clear titles make it easier to understand what needs doing
5. **Don't Overload:** Aim for 3-10 subtasks per task for best clarity

## Subtask Example

**Main Task:** "Build user authentication"

**Subtasks:**
- [ ] Design login form UI
- [ ] Create user registration endpoint
- [ ] Add password hashing
- [x] Write unit tests (already done)
- [ ] Add password reset functionality
- [ ] Deploy to staging

Progress: 1/6 (17%)

## Troubleshooting

**Problem:** Subtask won't add
- **Solution:** Make sure the input field isn't empty, then press Enter or click Add

**Problem:** Changes aren't saving
- **Solution:** Check your internet connection, try adding the subtask again

**Problem:** Modal won't open
- **Solution:** Refresh the page, or try clicking the button again

**Problem:** Progress bar doesn't update
- **Solution:** Close and reopen the modal, or refresh the page

## Related Actions

- **Edit Task:** Click task card to edit main task details (title, etc.)
- **Delete Task:** Click trash icon on task card (soft delete only)
- **View All Tasks:** Scroll on main board or use filters
- **Invite Team:** Click Invite button at top of board

## Keyboard Navigation

When modal is open:
- **Tab** - Move between interactive elements
- **Space** - Toggle checkbox
- **Enter** - Activate focused button
- **ESC** - Close modal
- **Click** - Direct interaction with any element

## Performance Notes

- Subtasks load instantly from cached task data
- Adding/deleting subtasks takes ~500ms (server sync)
- Progress calculation is real-time and instant
- Modal animations are smooth (300-500ms)

## Browser Support

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## What's Stored

Each subtask stores:
- Unique ID (auto-generated)
- Title (your text)
- Completion status (checked/unchecked)
- Order position (for reordering)
- Creation timestamp
- Parent task reference

All stored safely in the database as JSON.
