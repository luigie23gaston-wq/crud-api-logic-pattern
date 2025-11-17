<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default users
        \App\Models\User::create([
            'username' => 'UserSample',
            'email' => 'usersample@example.com',
            'password' => bcrypt('UserSample1!')
        ]);

        \App\Models\User::create([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password')
        ]);

        // seed some sample cities for the weather autosuggest
        $this->call(\Database\Seeders\CitiesSeeder::class);
        
        // project seeding removed: projects will be created by users at runtime
    }
}
