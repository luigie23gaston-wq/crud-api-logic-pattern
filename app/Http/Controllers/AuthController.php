<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLogin(\Illuminate\Http\Request $request)
    {
        // If already authenticated, send them to the app home (welcome)
        if (Auth::check()) {
            return redirect('/');
        }

        // Render login view with no-cache headers so browsers don't serve a cached
        // login page after the user has logged in and pressed Back.
        $response = response()->view('auth.login');
        return $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                        ->header('Pragma', 'no-cache')
                        ->header('Expires', '0');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        // Attempt login using username (not email)
        if (Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password']])) {
            $request->session()->regenerate();

            // If request expects JSON (AJAX), return JSON with redirect URL
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Login successful',
                    'redirect' => url('/')
                ]);
            }

            // Otherwise perform a normal redirect
            return redirect()->intended('/');
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        return back()->withErrors(['username' => 'Invalid credentials']);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string|max:255',
            'password' => 'required|string|min:6'
        ]);

        // case-insensitive username duplicate check
        $username = $data['username'];
        $exists = User::whereRaw('LOWER(username) = ?', [mb_strtolower($username)])->exists();
        if ($exists) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['errors' => ['username' => ['Username already taken']]], 422);
            }
            return back()->withErrors(['username' => 'Username already taken'])->withInput();
        }

        $user = User::create([
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            // users.email is not nullable in the migration; derive a placeholder
            // email from the username to satisfy the NOT NULL + unique constraint.
            'email' => $data['username'] . '@example.test'
        ]);

        Auth::login($user);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Registered and logged in',
                'redirect' => url('/')
            ]);
        }

        return redirect('/');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return response()->json(['success' => true, 'message' => 'Logged out']);
    }
}
