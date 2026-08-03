<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    public function test_can_get_students(): void
    {
        Student::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'nis' => '1001',
            'name' => 'Ahmad Fauzi',
            'class_name' => 'X IPA 1',
            'gender' => 'L',
            'photo_url' => '',
            'qr_code' => 'SCH-QR-1001',
            'created_at' => now()->toIso8601String(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/students');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    public function test_can_create_student(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/students', [
                'nis' => '1001',
                'name' => 'Siti Rahma',
                'class_name' => 'X IPA 1',
                'gender' => 'P',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'nis',
                'name',
                'class_name',
                'gender',
                'qr_code',
            ]);

        $this->assertDatabaseHas('students', [
            'nis' => '1001',
            'name' => 'Siti Rahma',
        ]);
    }

    public function test_cannot_create_duplicate_nis(): void
    {
        Student::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'nis' => '1001',
            'name' => 'Ahmad Fauzi',
            'class_name' => 'X IPA 1',
            'gender' => 'L',
            'photo_url' => '',
            'qr_code' => 'SCH-QR-1001',
            'created_at' => now()->toIso8601String(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/students', [
                'nis' => '1001',
                'name' => 'Siti Rahma',
                'class_name' => 'X IPA 1',
                'gender' => 'P',
            ]);

        $response->assertStatus(400)
            ->assertJson(['success' => false]);
    }

    public function test_can_update_student(): void
    {
        $student = Student::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'nis' => '1001',
            'name' => 'Ahmad Fauzi',
            'class_name' => 'X IPA 1',
            'gender' => 'L',
            'photo_url' => '',
            'qr_code' => 'SCH-QR-1001',
            'created_at' => now()->toIso8601String(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/students/{$student->id}", [
                'name' => 'Ahmad Fauzian',
                'class_name' => 'X IPA 2',
            ]);

        $response->assertStatus(200)
            ->assertJson(['name' => 'Ahmad Fauzian']);

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'name' => 'Ahmad Fauzian',
            'class_name' => 'X IPA 2',
        ]);
    }

    public function test_can_delete_student(): void
    {
        $student = Student::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'nis' => '1001',
            'name' => 'Ahmad Fauzi',
            'class_name' => 'X IPA 1',
            'gender' => 'L',
            'photo_url' => '',
            'qr_code' => 'SCH-QR-1001',
            'created_at' => now()->toIso8601String(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/students/{$student->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('students', ['id' => $student->id]);
    }

    public function test_can_seed_demo_students(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/students/seed-demo');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseCount('students', 12);
    }
}
