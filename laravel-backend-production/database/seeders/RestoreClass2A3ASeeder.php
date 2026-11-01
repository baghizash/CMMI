<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class RestoreClass2A3ASeeder extends Seeder
{
    /**
     * Perbaiki tabrakan promosi manual 2A -> 3A: anak angkatan 2A
     * dikenali dari blok NIS seeder SD (2A = 3041-3060, 3A = 3081-3100).
     * Setiap siswa AKTIF di kedua blok itu yang kelasnya sekarang
     * tidak sesuai blok NIS-nya dikembalikan ke kelas asalnya, dari
     * kelas mana pun dia sekarang berada (3A hasil tabrakan, 4A bila
     * sempat ikut rollover, dst). Siswa di luar dua blok ini dan
     * siswa berstatus alumni tidak disentuh.
     */
    public function run(): void
    {
        $blocks = [
            ['from' => 3041, 'to' => 3060, 'class' => '2A'],
            ['from' => 3081, 'to' => 3100, 'class' => '3A'],
        ];

        $movedTotal = 0;

        foreach ($blocks as $b) {
            $students = Student::where('status', 'aktif')
                ->whereRaw('CAST(nis AS UNSIGNED) BETWEEN ? AND ?', [$b['from'], $b['to']])
                ->get();

            $moved = 0;
            foreach ($students as $student) {
                if ($student->class_name !== $b['class']) {
                    $this->command->line("  {$student->name} (NIS {$student->nis}): {$student->class_name} -> {$b['class']}");
                    $student->class_name = $b['class'];
                    $student->save();
                    $moved++;
                }
            }

            $movedTotal += $moved;
            $this->command->info("Blok {$b['class']}: {$students->count()} siswa terdaftar, {$moved} dikembalikan.");
        }

        $c2a = Student::where('status', 'aktif')->where('class_name', '2A')->count();
        $c3a = Student::where('status', 'aktif')->where('class_name', '3A')->count();
        $this->command->info("Selesai. Total dikembalikan: {$movedTotal}. Isi kelas sekarang: 2A = {$c2a} siswa, 3A = {$c3a} siswa.");
    }
}
