<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Student $student;
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

        $this->student = Student::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'nis' => '1001',
            'name' => 'Ahmad Fauzi',
            'class_name' => 'X IPA 1',
            'gender' => 'L',
            'photo_url' => '',
            'qr_code' => 'SCH-QR-1001',
            'created_at' => now()->toIso8601String(),
        ]);
    }

    public function test_can_scan_attendance(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/attendance/scan', [
                'nis' => '1001',
                'status' => 'Hadir',
                'mode' => 'masuk',
                'recorded_by' => 'Guru Piket',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('attendance', [
            'student_id' => $this->student->id,
            'status' => 'Hadir',
        ]);
    }

    public function test_cannot_scan_nonexistent_student(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/attendance/scan', [
                'nis' => '9999',
                'status' => 'Hadir',
            ]);

        $response->assertStatus(404);
    }

    public function test_automatic_late_detection(): void
    {
        $this->freezeTime(now()->setTime(7, 30, 0));

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/attendance/scan', [
                'nis' => '1001',
                'status' => 'Hadir',
                'mode' => 'masuk',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('attendance', [
            'student_id' => $this->student->id,
            'status' => 'Terlambat',
        ]);
    }

    public function test_can_record_manual_attendance(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/attendance/manual', [
                'student_id' => $this->student->id,
                'date' => now()->format('Y-m-d'),
                'status' => 'Sakit',
                'recorded_by' => 'Admin',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('attendance', [
            'student_id' => $this->student->id,
            'status' => 'Sakit',
        ]);
    }

    public function test_can_get_attendance(): void
    {
        Attendance::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'student_id' => $this->student->id,
            'nis' => '1001',
            'student_name' => 'Ahmad Fauzi',
            'class_name' => 'X IPA 1',
            'date' => now()->format('Y-m-d'),
            'time' => now()->format('H:i:s'),
            'time_out' => null,
            'status' => 'Hadir',
            'recorded_by' => 'Guru Piket',
            'created_at' => now()->toIso8601String(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/attendance?date=' . now()->format('Y-m-d'));

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    public function test_can_delete_attendance(): void
    {
        $attendance = Attendance::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'student_id' => $this->student->id,
            'nis' => '1001',
            'student_name' => 'Ahmad Fauzi',
            'class_name' => 'X IPA 1',
            'date' => now()->format('Y-m-d'),
            'time' => now()->format('H:i:s'),
            'time_out' => null,
            'status' => 'Hadir',
            'recorded_by' => 'Guru Piket',
            'created_at' => now()->toIso8601String(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/attendance/{$attendance->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('attendance', ['id' => $attendance->id]);
    }
}
