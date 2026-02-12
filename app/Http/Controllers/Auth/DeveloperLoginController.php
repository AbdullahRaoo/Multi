<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ArticleRegistrationSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class DeveloperLoginController extends Controller
{
    /**
     * Show the developer login form.
     */
    public function showLoginForm()
    {
        // If already logged in as developer, redirect to dashboard
        if (session('is_developer')) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/developer-login');
    }

    /**
     * Handle developer login attempt.
     */
    public function login(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        // Get the annotation password from settings
        $hashedPassword = ArticleRegistrationSetting::getValue('password');

        if (!$hashedPassword) {
            return back()->withErrors([
                'password' => 'Developer access has not been configured yet.',
            ]);
        }

        // Verify password
        if (!Hash::check($request->password, $hashedPassword)) {
            return back()->withErrors([
                'password' => 'Incorrect password.',
            ]);
        }

        // Set developer session flag
        session(['is_developer' => true]);

        return redirect()->route('dashboard');
    }

    /**
     * Log out from developer session.
     */
    public function logout(Request $request)
    {
        session()->forget('is_developer');
        
        return redirect()->route('home');
    }
}
