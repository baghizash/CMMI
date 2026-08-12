<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\TeacherAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_teacher_to_class_and_subject(): void
    {
        $admin = User::create([
            'username' => 'admin',
            'name' => 'Admin User',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $teacher = User::create([
            'username' => 'gurutest',
            'name' => 'Pak Budi',
            'password' => bcrypt('password123'),
            'role' => 'guru',
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/teacher-assignments', [
                'user_id' => $teacher->id,
                'teacher_name' => $teacher->name,
                'class_name' => 'X IPA 1',
                'subject_name' => 'IPA',
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('teacher_assignments', [
            'teacher_name' => 'Pak Budi',
            'class_name' => 'X IPA 1',
            'subject_name' => 'IPA',
        ]);
    }

    public function test_teacher_can_fetch_own_scope(): void
    {
        $teacher = User::create([
            'username' => 'gurutest',
            'name' => 'Pak Budi',
            'password' => bcrypt('password123'),
            'role' => 'guru',
        ]);

        TeacherAssignment::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $teacher->id,
            'username' => $teacher->username,
            'teacher_name' => $teacher->name,
            'class_name' => 'X IPA 1',
            'subject_name' => 'IPA',
        ]);

        $token = $teacher->createToken('teacher-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/teacher-assignments/my-scope');

        $response->assertStatus(200)
            ->assertJson([
                'is_admin' => false,
                'classes' => ['X IPA 1'],
                'subjects' => ['IPA'],
            ]);
    }
}
