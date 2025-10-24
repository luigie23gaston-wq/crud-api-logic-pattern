---
applyTo: '**'
---

# Tailwind Alpine CRUD Instructions

## General Guidelines

**NEVER USE INLINE CSS AND JS** - All CSS must go in `public/css/` and all JavaScript must go in `public/js/`.

## Project Overview

Create a comprehensive CRUD system using:
- **Tailwind CSS** for design and styling
- **FontAwesome** for icons
- **Toast notifications** for success/error feedback
- **Alpine.js** for frontend handling
- **AJAX requests** for all operations (table load, create, view, edit, trash/soft delete)
- **No page reloads** - everything must be AJAX-based
- **No force delete** - only soft deletes allowed

## Database Migration

Create migration for user records with:
- `firstname` (string, 100 chars)
- `lastname` (string, 100 chars) 
- `image` (nullable string)
- Soft deletes support

```bash
php artisan make:migration create_user_records_table --create=user_records
```

## File Structure

```
laravel-project/
├─ resources/
│  ├─ views/
│  │  ├─ layouts/app.blade.php
│  │  ├─ users/index.blade.php      # main page with floating datatable
│  │  └─ components/
│  │     └─ datatable.blade.php
│  └─ modal/                        # MODALS MUST HAVE THEIR OWN FOLDER
│     ├─ create.blade.php
│     ├─ view.blade.php
│     ├─ edit.blade.php
│     └─ trash-confirm.blade.php
├─ public/
│  ├─ css/
│  │  └─ crud.css                   # ALL CSS HERE - NO INLINE CSS
│  └─ js/
│     └─ crud.js                    # ALL JS HERE - NO INLINE JS
├─ routes/
│  └─ web.php
├─ app/
│  ├─ Http/
│  │  └─ Controllers/
│  │     └─ UserAjaxController.php
│  └─ Models/
│     └─ UserRecord.php
└─ database/
   └─ migrations/
      └─ xxxx_create_user_records_table.php
```

## Design References

- **Table Design**: Use Tailwind CSS table design with selectable rows from https://preline.co/docs/tables.html
- **Modal Design**: Follow modal patterns from https://preline.co/docs/modal.html

## UI Design Requirements

### Main Table Layout
- Floating div container with datatable inside
- **Table Columns**: First Name, Last Name, Image
- **Top Left**: Eye icon with dropdown for viewable records (5, 10, 25, 50, 100)
- **Top Right**: Search input field + gear settings icon with dropdown (Create, View, Edit, Trash)
- **Bottom Left**: Pagination info ("Showing 1 to 5 of 10 entries")
- **Bottom Right**: Pagination controls (Previous "<", page numbers 1,2,3,4,5, Next ">")

### Table Features
- Selectable rows with `whitespace-nowrap`
- Hoverable rows and columns with animations
- Multiple row selection support

### Modal Structure
Each modal must have:
- **Modal Title** (e.g., "Create") 
- **Right side**: X close icon
- **Modal Body**: Input fields and file upload
- **Modal Footer**: Action buttons

## Validation Requirements

### Frontend Validation
- **Required fields**: Show animation and error text below input
- **First Name & Last Name**: Only letters allowed (regex: `/^[A-Za-z]+$/`)
- **Validation timing**: On submit and on blur
- **Error handling**: Add `input-error-animate` class (shake effect)
- **Error display**: Show error paragraph with `data-error-for="fieldname"`

### Backend Validation
- Server returns 422 status with error object
- Display server validation messages using same UI pattern

## CRUD Logic & Business Rules

### Create Operation
- Gear icon → Create → Opens modal
- Validate names (letters only)
- Optional image upload
- On success: Center toast (2.5s), reload table via AJAX

### View/Edit Operations
- **Must select exactly 1 row**
- If 0 or 2+ rows selected: Show warning toast
- Single selection required for both view and edit

### Trash Operation (Soft Delete)
- Multiple row selection allowed
- Show confirmation modal
- Send array of IDs: `{ids: [1,2,3]}`
- **No force delete** - only soft deletes

### Search & Pagination
- Server-side processing
- Index endpoint returns JSON paginated structure
- Render pagination UI in `crud.js`

## Toast Notification System

### Toast Behavior
- **Placement**: Center of screen
- **Duration**: Auto-hide after 2.5 seconds (2500ms)
- **Types**: success, error, warning
- **Implementation**: Use `toast()` function in `crud.js`
- **No external libraries** - simple DOM creation + CSS animation

## AJAX Implementation

### All operations must be AJAX:
- Table loading
- Create records
- View records  
- Edit records
- Trash (soft delete)
- Search functionality
- Pagination

### Routes Structure
```php
Route::get('/users', [UserAjaxController::class, 'index']);           // JSON paginated data
Route::get('/users/{id}', [UserAjaxController::class, 'show']);      // JSON single record
Route::post('/users', [UserAjaxController::class, 'store']);         // Create via AJAX
Route::post('/users/{id}', [UserAjaxController::class, 'update']);   // Update via AJAX
Route::delete('/users', [UserAjaxController::class, 'trash']);       // Soft delete array of IDs
```

## Model Requirements

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserRecord extends Model
{
    use SoftDeletes;

    protected $table = 'user_records';
    protected $fillable = ['firstname','lastname','image'];
}
```

## Migration Structure

```php
public function up()
{
    Schema::create('user_records', function (Blueprint $table) {
        $table->id();
        $table->string('firstname', 100);
        $table->string('lastname', 100);
        $table->string('image')->nullable();
        $table->timestamps();
        $table->softDeletes(); // soft delete column
    });
}
```

## Controller Implementation

```php
<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserRecord;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Validator;

class UserAjaxController extends Controller
{
    public function index(Request $req)
    {
        $perPage = (int) $req->get('per_page', 5);
        $search = $req->get('search', '');

        $q = UserRecord::query();
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
        $v = Validator::make($req->all(), [
            'firstname' => ['required','regex:/^[A-Za-z]+$/'],
            'lastname'  => ['required','regex:/^[A-Za-z]+$/'],
            'image'     => ['nullable','image','max:2048'],
        ]);
        if ($v->fails()) {
            return response()->json(['errors'=>$v->errors()], 422);
        }

        $data = $req->only('firstname','lastname');
        if ($req->hasFile('image')) {
            $file = $req->file('image');
            $filename = Str::random(12).'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('user_images', $filename, 'public');
            $data['image'] = $path;
        }

        $rec = UserRecord::create($data);
        return response()->json(['message'=>'Created','record'=>$rec], 201);
    }

    public function update(Request $req, $id)
    {
        $rec = UserRecord::findOrFail($id);

        $v = Validator::make($req->all(), [
            'firstname' => ['required','regex:/^[A-Za-z]+$/'],
            'lastname'  => ['required','regex:/^[A-Za-z]+$/'],
            'image'     => ['nullable','image','max:2048'],
        ]);
        if ($v->fails()) {
            return response()->json(['errors'=>$v->errors()], 422);
        }

        $rec->firstname = $req->firstname;
        $rec->lastname = $req->lastname;

        if ($req->hasFile('image')) {
            if ($rec->image) Storage::disk('public')->delete($rec->image);

            $file = $req->file('image');
            $filename = Str::random(12).'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('user_images', $filename, 'public');
            $rec->image = $path;
        }

        $rec->save();
        return response()->json(['message'=>'Updated','record'=>$rec]);
    }

    public function trash(Request $req)
    {
        $ids = $req->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message'=>'No ids provided'], 422);
        }
        UserRecord::whereIn('id', $ids)->delete(); // soft delete
        return response()->json(['message'=>'Trashed']);
    }
}
```

## Accessibility & Animation

- Table rows use hover classes for hoverable effect
- Use `whitespace-nowrap` to prevent text wrapping
- Follow Preline table classes for consistent styling
- Modal follows Preline modal anatomy
- All modals stored in `resources/modal/` as reusable partials

## Key Restrictions

1. **NO INLINE CSS OR JS** - Everything must be in separate files
2. **NO PAGE RELOADS** - All operations via AJAX only
3. **NO FORCE DELETE** - Only soft deletes allowed
4. **EXACT ROW SELECTION** - View/Edit requires exactly 1 selected row
5. **LETTERS ONLY** - First/Last names must contain only alphabetic characters