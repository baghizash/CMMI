<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users(): void
    {
        $admin = User::create([
            'username' => 'admin',
            'name' => 'Admin User',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'username', 'role']
                ]
            ]);
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $teacher = User::create([
            'username' => 'guru1',
            'name' => 'Guru Test',
            'password' => bcrypt('password123'),
            'role' => 'guru',
        ]);

        $token = $teacher->createToken('teacher-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_user_can_change_own_password(): void
    {
        $user = User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'password' => bcrypt('oldpassword'),
            'role' => 'guru',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/change-password', [
                'current_password' => 'oldpassword',
                'new_password' => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
