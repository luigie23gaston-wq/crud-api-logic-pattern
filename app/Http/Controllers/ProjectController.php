<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::where('user_id', Auth::id())
            ->with('user:id,username')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($project) {
                return array_merge($project->toArray(), [
                    'user_name' => $project->user->username
                ]);
            });

        $stats = [
            'total' => $projects->count(),
            'active' => collect($projects)->where('is_archived', false)->count(),
            'archived' => collect($projects)->where('is_archived', true)->count(),
        ];

        return response()->json([
            'ok' => true,
            'projects' => $projects,
            'stats' => $stats
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $iconOptions = [
            ['icon' => 'fas fa-rocket', 'color' => 'purple'],
            ['icon' => 'fas fa-chart-line', 'color' => 'green'],
            ['icon' => 'fas fa-code', 'color' => 'blue'],
            ['icon' => 'fas fa-palette', 'color' => 'yellow'],
        ];

        $randomIcon = $iconOptions[array_rand($iconOptions)];

        $project = Project::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'icon' => $randomIcon['icon'],
            'icon_color' => $randomIcon['color'],
            'status' => 'Active',
            'status_color' => 'green',
            'progress' => 0,
            'members' => 1,
            'is_archived' => false,
        ]);

        $project->load('user:id,username');
        $projectData = array_merge($project->toArray(), [
            'user_name' => $project->user->username
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Project created successfully',
            'project' => $projectData
        ], 201);
    }

    public function show($id)
    {
        $project = Project::where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'ok' => true,
            'project' => $project
        ]);
    }

    public function update(Request $request, $id)
    {
        $project = Project::where('user_id', Auth::id())
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $project->update($request->only(['name', 'description']));

        $project->load('user:id,username');
        $projectData = array_merge($project->toArray(), [
            'user_name' => $project->user->username
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Project updated successfully',
            'project' => $projectData
        ]);
    }

    public function destroy($id)
    {
        $project = Project::where('user_id', Auth::id())
            ->findOrFail($id);

        $project->delete(); // Soft delete

        return response()->json([
            'ok' => true,
            'message' => 'Project archived successfully'
        ]);
    }
}

