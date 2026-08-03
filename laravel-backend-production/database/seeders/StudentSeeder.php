<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample students
        $students = [
            [
                'nis' => '001',
                'name' => 'Adi Suryanto',
                'class_name' => '10A',
                'gender' => 'Laki-laki',
                'qr_code' => 'QR-001-' . Str::random(8),
            ],
            [
                'nis' => '002',
                'name' => 'Budi Santoso',
                'class_name' => '10A',
                'gender' => 'Laki-laki',
                'qr_code' => 'QR-002-' . Str::random(8),
            ],
            [
                'nis' => '003',
                'name' => 'Citra Dewi',
                'class_name' => '10B',
                'gender' => 'Perempuan',
                'qr_code' => 'QR-003-' . Str::random(8),
            ],
            [
                'nis' => '004',
                'name' => 'Dani Pratama',
                'class_name' => '10B',
                'gender' => 'Laki-laki',
                'qr_code' => 'QR-004-' . Str::random(8),
            ],
        ];

        foreach ($students as $student) {
            Student::create([
                'id' => (string) Str::uuid(),
                ...$student,
                'created_at' => now(),
            ]);
        }
    }
}
