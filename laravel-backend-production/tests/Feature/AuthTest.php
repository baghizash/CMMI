<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_login_with_valid_credentials(): void
    {
        $user = User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'testuser',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'token',
                'role',
                'name',
            ]);
    }

    public function test_cannot_login_with_invalid_credentials(): void
    {
        User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'username' => 'testuser',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    public function test_can_get_authenticated_user(): void
    {
        $user = User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'username',
                'name',
                'role',
            ]);
    }

    public function test_can_logout(): void
    {
        $user = User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'password' => bcrypt('password123'),
            'role' => 'teacher',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
