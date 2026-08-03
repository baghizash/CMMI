<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample teacher user
        User::create([
            'username' => 'teacher1',
            'name' => 'Guru Pertama',
            'email' => 'teacher1@school.com',
            'password' => Hash::make('password123'),
            'role' => 'teacher'
        ]);

        // Create sample admin user
        User::create([
            'username' => 'admin',
            'name' => 'Administrator',
            'email' => 'admin@school.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]);
    }
}
