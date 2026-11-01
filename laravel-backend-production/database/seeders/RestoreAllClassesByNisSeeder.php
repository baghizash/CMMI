<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;

// Mengembalikan SETIAP siswa SD ke kelas asal blok NIS-nya dan
// berstatus aktif. Berguna bila data kelas berantakan karena uji
// coba kenaikan kelas / rollover: blok NIS bersifat tetap
// (3001-3020 = 1A, 3021-3040 = 1B, ..., 3221-3240 = 6B),
// jadi posisi benar tiap siswa selalu bisa diturunkan dari NIS-nya.
// Siswa di luar pola NIS SD tidak disentuh.
class RestoreAllClassesByNisSeeder extends Seeder
{
    public function run()
    {
        $classes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];
        $moved = 0;
        $counts = [];

        foreach (Student::all() as $student) {
            $nis = (int) $student->nis;
            if ($nis < 3001 || $nis > 3240) {
                continue;
            }
            $target = $classes[intdiv($nis - 3001, 20)];

            if ($student->class_name !== $target || $student->status !== 'aktif') {
                $this->command->info("{$student->nis} {$student->name}: {$student->class_name}/{$student->status} -> {$target}/aktif");
                $student->class_name = $target;
                $student->status = 'aktif';
                $student->save();
                $moved++;
            }
            $counts[$target] = ($counts[$target] ?? 0) + 1;
        }

        foreach ($classes as $c) {
            $this->command->info("{$c} = " . ($counts[$c] ?? 0) . ' siswa');
        }
        $this->command->info("Selesai: {$moved} siswa dikembalikan ke kelas blok NIS-nya.");
    }
}
