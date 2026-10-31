<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class YearRolloverUndoSeeder extends Seeder
{
    /**
     * Kebalikan persis YearRolloverSeeder (satu kali jalan = mundur
     * satu tahun ajaran):
     * - alumni dikembalikan menjadi siswa aktif kelas 6 (kelas
     *   terakhir mereka tidak pernah diubah rollover, jadi cukup
     *   statusnya yang dikembalikan)
     * - siswa aktif kelas 2-6 diturunkan satu tingkat (rombel tetap)
     * - siswa aktif kelas 1 dibiarkan (dianggap siswa baru yang
     *   masuk setelah rollover)
     * Nilai dan absensi tidak disentuh, sama seperti rollover-nya.
     */
    public function run(): void
    {
        $restored = 0;
        $demoted = 0;
        $kept = 0;
        $skipped = 0;

        foreach (Student::where('status', 'alumni')->get() as $student) {
            $student->status = 'aktif';
            $student->save();
            $restored++;
        }

        foreach (Student::where('status', 'aktif')->get() as $student) {
            if (!preg_match('/^([1-6])([AB])$/', (string) $student->class_name, $m)) {
                $skipped++;
                continue;
            }

            $grade = (int) $m[1];
            if ($grade === 1) {
                $kept++;
                continue;
            }

            $student->class_name = ($grade - 1) . $m[2];
            $student->save();
            $demoted++;
        }

        $this->command->info("Rollover dibatalkan: {$restored} alumni kembali aktif di kelas 6, {$demoted} siswa turun satu tingkat, {$kept} siswa kelas 1 dibiarkan, {$skipped} dilewati (pola kelas bukan SD).");
    }
}
