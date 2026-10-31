<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GuruUsersSeeder extends Seeder
{
    /**
     * Bersihkan penugasan lama, lalu buat user guru SD beserta penugasannya.
     *
     * - Semua baris teacher_assignments dihapus lebih dulu (permintaan Baghiz:
     *   mulai dari bersih).
     * - Jadwal dengan nama mapel SMA lama (Fisika, Kimia, Biologi, Sejarah,
     *   Ekonomi, PKN, Olahraga) dihapus karena sistem sekarang SD.
     * - 12 guru kelas (wali kelas 1A sampai 6B) mengampu mapel inti di
     *   kelasnya, ditambah guru PJOK, Bahasa Inggris, dan Seni Budaya.
     * - Password semua akun guru: guru123 (segera ganti setelah login).
     * Aman dijalankan ulang: user dikenali dari username dan dibuat ulang.
     */
    public function run(): void
    {
        // 1) Kosongkan penugasan dan jadwal bermapel SMA lama
        DB::table('teacher_assignments')->delete();
        DB::table('schedules')
            ->whereIn('subject_name', ['Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Ekonomi', 'PKN', 'Olahraga'])
            ->delete();

        $coreSubjects = [
            'Pendidikan Agama',
            'Pendidikan Pancasila',
            'Bahasa Indonesia',
            'Matematika',
            'IPAS',
            'Bahasa Daerah',
        ];

        // 2) Guru kelas: [username, nama, kelas]
        $homeroom = [
            ['guru.siti', 'Siti Rahmawati', '1A'],
            ['guru.dewi', 'Dewi Anggraini', '1B'],
            ['guru.agus', 'Agus Setiawan', '2A'],
            ['guru.rina', 'Rina Puspita', '2B'],
            ['guru.bambang', 'Bambang Nugroho', '3A'],
            ['guru.maya', 'Maya Kartika', '3B'],
            ['guru.joko', 'Joko Prasetyo', '4A'],
            ['guru.fitri', 'Fitri Handayani', '4B'],
            ['guru.andi', 'Andi Kurniawan', '5A'],
            ['guru.sri', 'Sri Wahyuni', '5B'],
            ['guru.dedi', 'Dedi Firmansyah', '6A'],
            ['guru.lilis', 'Lilis Salim', '6B'],
        ];

        $allClasses = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

        // 3) Guru mapel khusus: [username, nama, mapel, daftar kelas]
        $specialists = [
            ['guru.budi', 'Budi Santoso', 'PJOK', $allClasses],
            ['guru.ani', 'Ani Kusuma', 'Bahasa Inggris', ['3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B']],
            ['guru.tuti', 'Tuti Melati', 'Seni Budaya', $allClasses],
        ];

        $makeTeacher = function (string $username, string $name) {
            User::where('username', $username)->delete();
            return User::create([
                'username' => $username,
                'name' => $name,
                'password' => 'guru123',
                'role' => 'guru',
            ]);
        };

        $assign = function (User $user, string $className, string $subject) {
            DB::table('teacher_assignments')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => (string) $user->id,
                'username' => $user->username,
                'teacher_name' => $user->name,
                'class_name' => $className,
                'subject_name' => $subject,
                'created_at' => now(),
            ]);
        };

        foreach ($homeroom as [$username, $name, $className]) {

            $user = $makeTeacher($username, $name);
            // Penugasan wali kelas: guru kelas ini adalah wali kelasnya.
            \App\Models\HomeroomTeacher::updateOrCreate(
                ['class_name' => $className],
                [
                    'id' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'username' => $username,
                    'teacher_name' => $name,
                ]
            );
            foreach ($coreSubjects as $subject) {
                $assign($user, $className, $subject);
            }
        }

        foreach ($specialists as [$username, $name, $subject, $classList]) {
            $user = $makeTeacher($username, $name);
            foreach ($classList as $className) {
                $assign($user, $className, $subject);
            }
        }
    }
}
