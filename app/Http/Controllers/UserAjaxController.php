<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserRecord;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Validator;

class UserAjaxController extends Controller
{
    public function index(Request $req)
    {
        $perPage = (int) $req->get('per_page', 5);
        $search = $req->get('search', '');

        $q = UserRecord::with('creator');
        if ($search) {
            $q->where(function($s) use ($search) {
                $s->where('firstname','like',"%{$search}%")
                  ->orWhere('lastname','like',"%{$search}%");
            });
        }
        $data = $q->orderBy('id','desc')->paginate($perPage);
        return response()->json($data);
    }

    public function show($id)
    {
        $record = UserRecord::findOrFail($id);
        return response()->json($record);
    }

    public function store(Request $req)
    {
        // normalize inputs: trim name fields to avoid leading/trailing spaces
        $req->merge(['firstname' => is_string($req->firstname) ? trim($req->firstname) : $req->firstname, 'lastname' => is_string($req->lastname) ? trim($req->lastname) : $req->lastname]);
        $v = Validator::make($req->all(), [
            // allow alphabetic names with single spaces between words (e.g. "Mary Anne")
            'firstname' => ['required','regex:/^[A-Za-z]+(?: [A-Za-z]+)*$/'],
            'lastname'  => ['required','regex:/^[A-Za-z]+(?: [A-Za-z]+)*$/'],
            'image'     => ['nullable','image','max:2048'],
            'image_path' => ['nullable','string'],
        ]);
        if ($v->fails()) {
            return response()->json(['errors'=>$v->errors()], 422);
        }

        $data = $req->only('firstname','lastname');
        // check for duplicate (case-insensitive) firstname+lastname among non-deleted records
        $fname = $data['firstname'] ?? '';
        $lname = $data['lastname'] ?? '';
        if ($fname !== '' && $lname !== '') {
            // Use LOWER comparisons to be case-insensitive and DB-agnostic
            $exists = UserRecord::whereRaw('LOWER(firstname) = ? AND LOWER(lastname) = ?', [mb_strtolower($fname), mb_strtolower($lname)])->exists();
            if ($exists) {
                return response()->json(['errors' => ['firstname' => ["A record with this first and last name already exists"]]], 422);
            }
        }
        // support async upload that returns image_path
        if ($req->filled('image_path')) {
            $data['image'] = $req->input('image_path');
        }
        if ($req->hasFile('image')) {
            $file = $req->file('image');
            $filename = Str::random(12).'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('user_images', $filename, 'public');
            $data['image'] = $path;
        }

        // set creator if authenticated
        if (Auth::check()) $data['created_by'] = Auth::id();
        $rec = UserRecord::create($data);
        return response()->json(['message'=>'Succesfully Created','record'=>$rec], 201);
    }

    public function update(Request $req, $id)
    {
        $rec = UserRecord::findOrFail($id);

        // normalize inputs: trim name fields
        $req->merge(['firstname' => is_string($req->firstname) ? trim($req->firstname) : $req->firstname, 'lastname' => is_string($req->lastname) ? trim($req->lastname) : $req->lastname]);

        $v = Validator::make($req->all(), [
            'firstname' => ['required','regex:/^[A-Za-z]+(?: [A-Za-z]+)*$/'],
            'lastname'  => ['required','regex:/^[A-Za-z]+(?: [A-Za-z]+)*$/'],
            'image'     => ['nullable','image','max:2048'],
            'image_path' => ['nullable','string'],
        ]);
        if ($v->fails()) {
            return response()->json(['errors'=>$v->errors()], 422);
        }

        $rec->firstname = $req->firstname;
        $rec->lastname = $req->lastname;

        // check for duplicate (case-insensitive) firstname+lastname among other non-deleted records
        $fname = $rec->firstname ?? '';
        $lname = $rec->lastname ?? '';
        if ($fname !== '' && $lname !== '') {
            $exists = UserRecord::whereRaw('LOWER(firstname) = ? AND LOWER(lastname) = ?', [mb_strtolower($fname), mb_strtolower($lname)])
                        ->where('id', '!=', $rec->id)
                        ->exists();
            if ($exists) {
                return response()->json(['errors' => ['firstname' => ["Another record with this first and last name already exists"]]], 422);
            }
        }

        // allow async uploaded image path
        if ($req->filled('image_path')) {
            if ($rec->image) Storage::disk('public')->delete($rec->image);
            $rec->image = $req->input('image_path');
        }
        if ($req->hasFile('image')) {
            if ($rec->image) Storage::disk('public')->delete($rec->image);

            $file = $req->file('image');
            $filename = Str::random(12).'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('user_images', $filename, 'public');
            $rec->image = $path;
        }

        $rec->save();
        return response()->json(['message'=>'Successfully Updated','record'=>$rec]);
    }

    // Simple endpoint for async file uploads (returns stored path)
    public function upload(Request $req)
    {
        $v = Validator::make($req->all(), [
            'file' => ['required','image','max:4096'],
        ]);
        if ($v->fails()) return response()->json(['errors'=>$v->errors()], 422);

        if (!$req->hasFile('file')) return response()->json(['message'=>'No file provided'], 422);
        $file = $req->file('file');
        $filename = Str::random(12).'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs('user_images', $filename, 'public');
        return response()->json(['path' => $path, 'url' => Storage::url($path)], 201);
    }

    public function trash(Request $req)
    {
        $ids = $req->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message'=>'No ids provided'], 422);
        }
        UserRecord::whereIn('id', $ids)->delete(); // soft delete
        return response()->json(['message'=>'Data Trashed']);
    }

    // Return paginated soft-deleted records
    public function trashed(Request $req)
    {
        $perPage = (int) $req->get('per_page', 10);
        $q = UserRecord::onlyTrashed()->orderBy('deleted_at','desc');
        $data = $q->paginate($perPage);
        return response()->json($data);
    }

    // Restore soft-deleted records (accepts { ids: [] })
    public function restore(Request $req)
    {
        $ids = $req->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message'=>'No ids provided'], 422);
        }
        UserRecord::onlyTrashed()->whereIn('id', $ids)->restore();
        return response()->json(['message'=>'Restored']);
    }
}
