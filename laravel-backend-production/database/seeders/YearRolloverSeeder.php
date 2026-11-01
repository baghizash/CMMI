<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class YearRolloverSeeder extends Seeder
{
    /**
     * Tutup tahun ajaran: naikkan semua siswa aktif satu tingkat
     * (1A ke 2A, 2B ke 3B, dan seterusnya, rombel A/B dipertahankan)
     * dan jadikan siswa kelas 6 sebagai alumni (status 'alumni',
     * kelas terakhirnya tetap tercatat). Siswa dengan pola kelas di
     * luar 1-6 A/B (data demo lama) tidak disentuh dan dilaporkan.
     *
     * CATATAN: menjalankan seeder ini sekali lagi berarti mensimulasikan
     * satu tahun ajaran berikutnya (angkatan kelas 6 yang baru ikut
     * menjadi alumni, dst). Nilai dan absensi lama TIDAK dihapus:
     * transkrip tetap menampilkan semester sebelumnya sebagai riwayat.
     */
    public function run(): void
    {
        $students = Student::where('status', 'aktif')->get();

        $promoted = 0;
        $alumni = 0;
        $skipped = 0;

        foreach ($students as $student) {
            if (!preg_match('/^([1-6])([AB])$/', (string) $student->class_name, $m)) {
                $skipped++;
                continue;
            }

            $grade = (int) $m[1];
            $section = $m[2];

            if ($grade === 6) {
                $student->status = 'alumni';
                $student->save();
                $alumni++;
            } else {
                $student->class_name = ($grade + 1) . $section;
                $student->save();
                $promoted++;
            }
        }

        $this->command->info("Rollover selesai: {$promoted} siswa naik kelas, {$alumni} siswa kelas 6 menjadi alumni, {$skipped} siswa dilewati (pola kelas bukan SD).");
    }
}
