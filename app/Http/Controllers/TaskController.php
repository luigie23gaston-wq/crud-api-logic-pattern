<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskItem;
use App\Models\TaskSection;
use App\Models\Subtask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Show the task board for a specific project
     */
    public function show(Project $project)
    {
        // Ensure user owns this project
        if ($project->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        // Load task items grouped by column
        $taskItems = TaskItem::where('project_id', $project->id)
            ->orderBy('column')
            ->orderBy('order')
            ->get()
            ->groupBy('column');

        return view('task', [
            'project' => $project,
            'taskItems' => $taskItems,
        ]);
    }

    /**
     * Get task items (API endpoint for frontend)
     */
    public function getItems(Project $project)
    {
        if ($project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $items = TaskItem::where('project_id', $project->id)
            ->with('subtasks')
            ->orderBy('column')
            ->orderBy('order')
            ->get();

        return response()->json(['ok' => true, 'items' => $items]);
    }

    /**
     * Store a new task item
     */
    public function storeItem(Request $request, Project $project)
    {
        $validated = $request->validate([
            'task_section_id' => 'required|exists:task_sections,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'column' => 'required|in:eicaer,eihom,userAccess,dialoging,testing,notifications',
            'progress' => 'integer|min:0|max:100',
            'alt_progress' => 'integer|min:0|max:100',
            'subtasks' => 'string',
            'date' => 'nullable|string',
        ]);

        $taskItem = TaskItem::create(array_merge($validated, [
            'project_id' => $project->id,
        ]));

        return response()->json(['ok' => true, 'item' => $taskItem], 201);
    }

    /**
     * Update a task item
     */
    public function updateItem(Request $request, Project $project, TaskItem $taskItem)
    {
        $validated = $request->validate([
            'task_section_id' => 'nullable|exists:task_sections,id',
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'column' => 'in:eicaer,eihom,userAccess,dialoging,testing,notifications',
            'progress' => 'integer|min:0|max:100',
            'alt_progress' => 'integer|min:0|max:100',
            'subtasks' => 'string',
            'date' => 'nullable|string',
            'order' => 'integer',
        ]);

        $taskItem->update($validated);

        return response()->json(['ok' => true, 'item' => $taskItem]);
    }

    /**
     * Delete a task item
     */
    public function destroyItem(Project $project, TaskItem $taskItem)
    {
        $taskItem->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * Reorder task items within a column
     */
    public function reorderItems(Request $request, Project $project)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.order' => 'required|integer',
            'items.*.column' => 'required|string',
        ]);

        foreach ($validated['items'] as $item) {
            TaskItem::where('project_id', $project->id)
                ->where('id', $item['id'])
                ->update(['order' => $item['order'], 'column' => $item['column']]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Get subtasks for a task item
     */
    public function getSubtasks(Project $project, TaskItem $taskItem)
    {
        if ($taskItem->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $subtasks = Subtask::where('task_item_id', $taskItem->id)
            ->orderBy('order')
            ->get();

        return response()->json(['ok' => true, 'subtasks' => $subtasks]);
    }

    /**
     * Store a new subtask
     */
    public function storeSubtask(Request $request, Project $project, TaskItem $taskItem)
    {
        if ($taskItem->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'is_completed' => 'boolean',
        ]);

        // Get the max order for this task item and add 1
        $maxOrder = Subtask::where('task_item_id', $taskItem->id)->max('order') ?? 0;

        $subtask = Subtask::create([
            'task_item_id' => $taskItem->id,
            'title' => $validated['title'],
            'is_completed' => $validated['is_completed'] ?? false,
            'order' => $maxOrder + 1,
        ]);

        // Update task progress based on subtasks
        $this->updateTaskProgressFromSubtasks($taskItem);

        return response()->json(['ok' => true, 'subtask' => $subtask], 201);
    }

    /**
     * Update a subtask
     */
    public function updateSubtask(Request $request, Project $project, TaskItem $taskItem, Subtask $subtask)
    {
        if ($subtask->task_item_id !== $taskItem->id || $taskItem->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $validated = $request->validate([
            'title' => 'string|max:255',
            'is_completed' => 'boolean',
            'order' => 'integer|min:1',
        ]);

        $subtask->update($validated);

        // Update task progress based on subtasks
        $this->updateTaskProgressFromSubtasks($taskItem);

        return response()->json(['ok' => true, 'subtask' => $subtask]);
    }

    /**
     * Toggle subtask completion status
     */
    public function toggleSubtask(Project $project, TaskItem $taskItem, Subtask $subtask)
    {
        if ($subtask->task_item_id !== $taskItem->id || $taskItem->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $subtask->is_completed = !$subtask->is_completed;
        $subtask->save();

        // Update task progress based on subtasks
        $this->updateTaskProgressFromSubtasks($taskItem);

        return response()->json(['ok' => true, 'subtask' => $subtask]);
    }

    /**
     * Delete a subtask
     */
    public function destroySubtask(Project $project, TaskItem $taskItem, Subtask $subtask)
    {
        if ($subtask->task_item_id !== $taskItem->id || $taskItem->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $subtask->delete();

        // Update task progress based on subtasks
        $this->updateTaskProgressFromSubtasks($taskItem);

        return response()->json(['ok' => true]);
    }

    /**
     * Reorder subtasks within a task
     */
    public function reorderSubtasks(Request $request, Project $project, TaskItem $taskItem)
    {
        if ($taskItem->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $validated = $request->validate([
            'subtasks' => 'required|array',
            'subtasks.*.id' => 'required|integer',
            'subtasks.*.order' => 'required|integer',
        ]);

        foreach ($validated['subtasks'] as $item) {
            Subtask::where('task_item_id', $taskItem->id)
                ->where('id', $item['id'])
                ->update(['order' => $item['order']]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Calculate and update task progress based on subtasks
     */
    private function updateTaskProgressFromSubtasks(TaskItem $taskItem)
    {
        $subtasks = Subtask::where('task_item_id', $taskItem->id)->get();
        $subtaskCount = $subtasks->count();
        
        if ($subtaskCount > 0) {
            $completedCount = $subtasks->where('is_completed', true)->count();
            $progress = round(($completedCount / $subtaskCount) * 100);
            
            $taskItem->update([
                'progress' => $progress,
                'alt_progress' => $progress,
            ]);
        }
    }

    /**
     * Get sections for a project
     */
    public function getSections(Project $project)
    {
        if ($project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $sections = TaskSection::where('project_id', $project->id)
            ->with(['taskItems.subtasks'])
            ->orderBy('order')
            ->get();

        // Calculate progress for each task based on subtasks
        foreach ($sections as $section) {
            foreach ($section->taskItems as $task) {
                // Check if subtasks is loaded as a relationship (not the string column)
                if ($task->relationLoaded('subtasks')) {
                    $subtasksCollection = $task->getRelation('subtasks');
                    $subtaskCount = $subtasksCollection->count();
                    
                    if ($subtaskCount > 0) {
                        $completedCount = $subtasksCollection->where('is_completed', true)->count();
                        $calculatedProgress = round(($completedCount / $subtaskCount) * 100);
                        
                        // Update task progress if it doesn't match
                        if ($task->progress != $calculatedProgress) {
                            $task->progress = $calculatedProgress;
                            $task->alt_progress = $calculatedProgress;
                            $task->save();
                        }
                    }
                }
            }
        }

        return response()->json(['ok' => true, 'sections' => $sections]);
    }

    /**
     * Store a new section
     */
    public function storeSection(Request $request, Project $project)
    {
        if ($project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $maxOrder = TaskSection::where('project_id', $project->id)->max('order') ?? 0;

        $section = TaskSection::create([
            'project_id' => $project->id,
            'title' => $validated['title'],
            'order' => $maxOrder + 1,
        ]);

        return response()->json(['ok' => true, 'section' => $section], 201);
    }

    /**
     * Update a section
     */
    public function updateSection(Request $request, Project $project, TaskSection $section)
    {
        if ($section->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $validated = $request->validate([
            'title' => 'string|max:255',
            'order' => 'integer|min:0',
        ]);

        $section->update($validated);

        return response()->json(['ok' => true, 'section' => $section]);
    }

    /**
     * Reorder sections
     */
    public function reorderSections(Request $request, Project $project)
    {
        if ($project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $validated = $request->validate([
            'sections' => 'required|array',
            'sections.*.id' => 'required|integer',
            'sections.*.order' => 'required|integer',
        ]);

        foreach ($validated['sections'] as $item) {
            TaskSection::where('project_id', $project->id)
                ->where('id', $item['id'])
                ->update(['order' => $item['order']]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Reorder task items within a specific section
     */
    public function reorderSectionItems(Request $request, Project $project, TaskSection $section)
    {
        if ($section->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.order' => 'required|integer',
        ]);

        foreach ($validated['items'] as $item) {
            TaskItem::where('project_id', $project->id)
                ->where('task_section_id', $section->id)
                ->where('id', $item['id'])
                ->update(['order' => $item['order']]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Delete a section
     */
    public function destroySection(Project $project, TaskSection $section)
    {
        if ($section->project_id !== $project->id || $project->user_id !== Auth::id()) {
            return response()->json(['ok' => false], 403);
        }

        $section->delete();

        return response()->json(['ok' => true]);
    }
}
