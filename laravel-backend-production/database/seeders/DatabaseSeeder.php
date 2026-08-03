<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\GuruPiket;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Create users
        User::create([
            'username' => 'admin',
            'name' => 'Administrator Sekolah',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
        ]);

        User::create([
            'username' => 'guru',
            'name' => 'Ibu Guru (Piket)',
            'password' => bcrypt('guru123'),
            'role' => 'teacher',
        ]);

        User::create([
            'username' => 'kepsek',
            'name' => 'Kepala Sekolah',
            'password' => bcrypt('kepsek123'),
            'role' => 'admin',
        ]);

        // Create students
        $classes = ["X IPA 1", "X IPA 2", "XI IPS 1", "XI IPS 2", "XII MIPA"];
        $names = [
            ["Ahmad Fauzi", "L"], ["Siti Rahma", "P"], ["Budi Santoso", "L"],
            ["Dewi Lestari", "P"], ["Eko Prasetyo", "L"], ["Rina Melati", "P"],
            ["Joko Widodo", "L"], ["Sri Mulyani", "P"], ["Andi Pratama", "L"],
            ["Maya Sari", "P"], ["Doni Kusuma", "L"], ["Siska Amelia", "P"]
        ];

        $nisCounter = 1001;
        foreach ($names as $idx => [$name, $gender]) {
            $cls = $classes[$idx % count($classes)];
            $nis = (string) $nisCounter++;
            $qr = "SCH-QR-{$nis}-" . strtoupper(explode(' ', $name)[0]);

            Student::create([
                'id' => (string) Str::uuid(),
                'nis' => $nis,
                'name' => $name,
                'class_name' => $cls,
                'gender' => $gender,
                'photo_url' => '',
                'qr_code' => $qr,
                'created_at' => now()->toIso8601String(),
            ]);
        }

        // Create schedules
        $schedules = [
            ["Senin", 1, "X IPA 1", "Matematika", "Bu Ani", "07:30", "08:15", "R101"],
            ["Senin", 2, "X IPA 1", "Fisika", "Pak Rudi", "08:15", "09:00", "Lab Fisika"],
            ["Senin", 3, "X IPA 1", "Bahasa Indonesia", "Bu Dewi", "09:15", "10:00", "R101"],
            ["Selasa", 1, "X IPA 1", "Kimia", "Pak Herman", "07:30", "08:15", "Lab Kimia"],
            ["Selasa", 2, "XI IPS 2", "Ekonomi", "Bu Sinta", "08:15", "09:00", "R202"],
            ["Rabu", 1, "XII MIPA", "Biologi", "Pak Adi", "07:30", "08:15", "Lab Bio"],
        ];

        foreach ($schedules as [$day, $period, $class, $subject, $teacher, $start, $end, $room]) {
            Schedule::create([
                'id' => (string) Str::uuid(),
                'day' => $day,
                'period' => $period,
                'class_name' => $class,
                'subject_name' => $subject,
                'teacher_name' => $teacher,
                'start_time' => $start,
                'end_time' => $end,
                'room' => $room,
                'created_at' => now()->toIso8601String(),
            ]);
        }

        // Create guru piket
        GuruPiket::create([
            'id' => (string) Str::uuid(),
            'date' => now()->format('Y-m-d'),
            'teacher_name' => 'Bu Ani Wijaya',
            'notes' => 'Piket harian - fokus kelas X',
            'created_at' => now()->toIso8601String(),
        ]);
    }
}

