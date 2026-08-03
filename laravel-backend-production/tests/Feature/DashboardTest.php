<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    public function test_can_get_dashboard_stats(): void
    {
        // Create students
        $students = [];
        for ($i = 1; $i <= 5; $i++) {
            $students[] = Student::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'nis' => "100{$i}",
                'name' => "Student {$i}",
                'class_name' => 'X IPA 1',
                'gender' => 'L',
                'photo_url' => '',
                'qr_code' => "SCH-QR-100{$i}",
                'created_at' => now()->toIso8601String(),
            ]);
        }

        // Create attendance records
        foreach ($students as $index => $student) {
            $status = match ($index) {
                0 => 'Hadir',
                1 => 'Terlambat',
                2 => 'Sakit',
                3 => 'Izin',
                default => 'Alpa',
            };

            Attendance::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'student_id' => $student->id,
                'nis' => $student->nis,
                'student_name' => $student->name,
                'class_name' => 'X IPA 1',
                'date' => now()->format('Y-m-d'),
                'time' => now()->format('H:i:s'),
                'time_out' => $index === 0 ? now()->format('H:i:s') : null,
                'status' => $status,
                'recorded_by' => 'Guru Piket',
                'created_at' => now()->toIso8601String(),
            ]);
        }

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/dashboard/stats?date=' . now()->format('Y-m-d'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'date',
                'total_students',
                'total_classes',
                'classes',
                'hadir',
                'terlambat',
                'sakit',
                'izin',
                'alpa',
                'sudah_pulang',
                'belum_absen',
                'attendance_today',
                'guru_piket_hari_ini',
            ]);

        // Check values separately as data structure verification
        $data = $response->json();
        $this->assertEquals(5, $data['total_students']);
        $this->assertEquals(1, $data['hadir']);
        $this->assertEquals(1, $data['terlambat']);
        $this->assertEquals(1, $data['sakit']);
        $this->assertEquals(1, $data['izin']);
        $this->assertEquals(1, $data['alpa']);
    }
}
