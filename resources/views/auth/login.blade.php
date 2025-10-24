<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Login & Register</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link rel="stylesheet" href="{{ asset('css/login.css') }}">
    <link rel="stylesheet" href="{{ asset('css/crud.css') }}">
</head>
<body class="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 to-purple-500 p-4">
    @if(Auth::check())
        <script>window.location.replace('{{ url('/') }}');</script>
    @endif

    <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden auth-card" x-data="authForm()">
        @if(session('auth_message'))
            <div class="max-w-4xl mx-auto mt-4 px-4">
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p class="text-yellow-700">{{ session('auth_message') }}</p>
                </div>
            </div>
        @endif
        <div class="flex flex-col md:flex-row">
            <!-- Register Section -->
            <div class="w-full md:w-1/2 register-panel bg-white">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
                <form @submit.prevent="register">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2" for="reg-username">Username</label>
                        <input id="reg-username" type="text" placeholder="Enter your username" x-model="registerData.username" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200" />
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2" for="reg-password">Password</label>
                        <input id="reg-password" :type="showRegPassword ? 'text' : 'password'" placeholder="Enter your password" x-model="registerData.password" @input="validatePassword" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200" />
                        <div class="flex justify-end mt-1">
                            <button type="button" class="text-sm text-purple-600" @click.prevent="showRegPassword = !showRegPassword"> <span x-text="showRegPassword ? 'Hide' : 'Show'"></span> </button>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2" for="reg-password-confirm">Confirm Password</label>
                        <input id="reg-password-confirm" :type="showRegPassword ? 'text' : 'password'" placeholder="Confirm password" x-model="registerData.passwordConfirm" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200" />
                    </div>

                    <div class="mb-6" x-show="registerData.password.length > 0">
                        <div class="flex justify-between mb-1">
                            <span class="text-sm text-gray-600">Password strength</span>
                            <span class="text-sm font-medium" :class="{ 'text-red-500': passwordStrength === 1, 'text-orange-500': passwordStrength === 2, 'text-yellow-500': passwordStrength === 3, 'text-green-500': passwordStrength === 4 }" x-text="passwordStrengthText"></span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="h-2.5 rounded-full transition-all duration-300" :class="{ 'bg-red-500': passwordStrength === 1, 'bg-orange-500': passwordStrength === 2, 'bg-yellow-500': passwordStrength === 3, 'bg-green-500': passwordStrength === 4 }" :style="`width: ${passwordStrength * 25}%`"></div>
                        </div>
                        <div class="mt-2 text-xs text-gray-500">
                            <p x-show="passwordStrength < 4">Must contain at least 8 characters, 1 capital letter, 1 number, and 1 special character</p>
                            <p x-show="passwordStrength === 4" class="text-green-500 font-medium">Strong password!</p>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition duration-200">Register</button>
                </form>
            </div>

            <!-- Login Section -->
            <div class="w-full md:w-1/2 login-panel bg-gradient-to-br from-purple-50 to-green-50">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">Sign In</h2>
                <form @submit.prevent="login">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2" for="login-username">Username</label>
                        <input id="login-username" type="text" placeholder="Enter your username" x-model="loginData.username" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" />
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-medium mb-2" for="login-password">Password</label>
                        <input id="login-password" :type="showLoginPassword ? 'text' : 'password'" placeholder="Enter your password" x-model="loginData.password" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" />
                        <div class="flex justify-between mt-1">
                            <button type="button" class="text-sm text-green-600" @click.prevent="showLoginPassword = !showLoginPassword"> <span x-text="showLoginPassword ? 'Hide' : 'Show'"></span> </button>
                            <!--<a href="#" class="text-sm text-green-600 hover:underline">Forgot password?</a>-->
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-gradient-to-r from-green-500 to-green-700 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 transition duration-200">Sign In</button>
                </form>
                <div class="mt-6 text-center">
                    
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/login.js') }}"></script>
    <!-- Auth result modal (used instead of toast on this page) -->
    @include('modal.login-modal-message')
</body>
</html>
