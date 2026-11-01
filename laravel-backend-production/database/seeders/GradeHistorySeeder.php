<?php

namespace Database\Seeders;

use App\Models\Semester;
use App\Models\Student;
use App\Models\SubjectGrade;
use App\Models\TeacherAssignment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use RuntimeException;

class GradeHistorySeeder extends Seeder
{
    /**
     * Perbaiki data nilai historis:
     *
     * (a) Pastikan semester-semester lampau ada: untuk setiap tahun ajaran
     *     dari (tahun berjalan - 5) sampai tahun berjalan, semester Ganjil
     *     dan Genap. Yang sudah ada (kecocokan name + academic_year) tidak
     *     disentuh, semester lampau selalu is_active = false, dan status
     *     aktif semester berjalan tidak pernah diubah.
     * (b) Isi nilai HISTORIS tiap siswa: untuk setiap tingkat kelas dari 1
     *     sampai kelas siswa saat ini, pada tahun ajaran ketika siswa berada
     *     di tingkat itu (kelas saat ini = tahun ajaran semester aktif,
     *     tiap tingkat di bawahnya = satu tahun lebih awal; huruf rombel
     *     mengikuti kelas siswa saat ini, mis. 6A -> 1A..6A). Kombinasi
     *     semester aktif dilewati (nilai berjalan sudah ada) dan semester
     *     yang belum dimulai (mis. Genap pada tahun berjalan) juga dilewati.
     *     Baris (siswa, semester, mapel) yang sudah ada dilewati, jadi
     *     seeder ini aman dijalankan ulang. Nilai akhir historis memakai
     *     rumus berbobot baru dan statusnya 'locked'.
     * (c) Hitung ulang final_total SEMUA baris nilai yang sudah ada dengan
     *     SubjectGrade::computeFinalTotal, supaya total tersimpan di mana
     *     pun cocok dengan rumus berbobot baru (bukan lagi rata-rata polos).
     */
    public function run(): void
    {
        $active = Semester::active();
        if (!$active) {
            throw new RuntimeException(
                'GradeHistorySeeder: tidak ada semester aktif di tabel semesters. '
                . 'Jalankan migrasi 2026_11_01_000002 (sistem semester) terlebih dahulu.'
            );
        }

        // Tahun pertama tahun ajaran aktif, mis. "2026/2027" -> 2026.
        $activeYearStart = (int) substr((string) $active->academic_year, 0, 4);
        if ($activeYearStart <= 0) {
            throw new RuntimeException(
                "GradeHistorySeeder: academic_year semester aktif tidak dikenal: '{$active->academic_year}'."
            );
        }

        $subjects = [
            'Pendidikan Agama',
            'Pendidikan Pancasila',
            'Bahasa Indonesia',
            'Matematika',
            'IPAS',
            'PJOK',
            'Seni Budaya',
            'Bahasa Inggris',
            'Bahasa Daerah',
        ];

        // ---- (a) Semester lampau ----------------------------------------
        $createdSemesters = 0;
        for ($y = $activeYearStart - 5; $y <= $activeYearStart; $y++) {
            $academicYear = $y . '/' . ($y + 1);
            $defs = [
                // Ganjil: Juli–Desember tahun pertama; Genap: Januari–Juni tahun kedua.
                ['name' => 'Ganjil', 'start_date' => sprintf('%04d-07-01', $y), 'end_date' => sprintf('%04d-12-31', $y)],
                ['name' => 'Genap', 'start_date' => sprintf('%04d-01-01', $y + 1), 'end_date' => sprintf('%04d-06-30', $y + 1)],
            ];
            foreach ($defs as $def) {
                $exists = Semester::where('name', $def['name'])
                    ->where('academic_year', $academicYear)
                    ->exists();
                if ($exists) {
                    continue;
                }
                Semester::create([
                    'id' => (string) Str::uuid(),
                    'name' => $def['name'],
                    'academic_year' => $academicYear,
                    'start_date' => $def['start_date'],
                    'end_date' => $def['end_date'],
                    'is_active' => false,
                ]);
                $createdSemesters++;
            }
        }

        // Peta semester per "Nama|TahunAjaran" untuk langkah (b).
        $semesterByTermYear = [];
        foreach (Semester::all() as $sem) {
            $semesterByTermYear[$sem->name . '|' . $sem->academic_year] = $sem;
        }

        // Guru pengampu per kelas+mapel, pola yang sama dengan RandomGradesSeeder.
        $teacherByClassSubject = [];
        foreach (TeacherAssignment::all() as $a) {
            $teacherByClassSubject[$a->class_name . '|' . $a->subject_name] = $a->user_id;
        }

        $clamp = fn ($v) => max(60, min(95, $v));

        // ---- (b) Nilai historis per siswa --------------------------------
        $inserted = 0;
        $skippedRows = 0;
        $skippedStudents = 0;

        foreach (Student::all() as $student) {
            if (!preg_match('/^(\d+)([A-Za-z]*)$/', (string) $student->class_name, $m)) {
                $skippedStudents++;
                continue;
            }
            $currentLevel = (int) $m[1];
            $suffix = $m[2] ?? '';

            // Level kemampuan dasar siswa (konsisten antar mapel), pola
            // yang sama dengan RandomGradesSeeder.
            mt_srand(crc32('ability-' . $student->nis));
            $ability = mt_rand(62, 97);

            for ($level = 1; $level <= $currentLevel; $level++) {
                $yearStart = $activeYearStart - ($currentLevel - $level);
                $academicYear = $yearStart . '/' . ($yearStart + 1);
                $histClass = $level . $suffix;

                foreach (['Ganjil', 'Genap'] as $term) {
                    $semester = $semesterByTermYear[$term . '|' . $academicYear] ?? null;
                    if (!$semester) {
                        continue;
                    }
                    // Semester aktif dilewati: nilai berjalannya sudah ada.
                    if ($semester->id === $active->id) {
                        continue;
                    }
                    // Semester yang belum dimulai (mis. Genap tahun berjalan)
                    // adalah masa depan: belum ada nilainya.
                    if ($semester->start_date->gt($active->start_date)) {
                        continue;
                    }

                    $end = Carbon::parse($semester->end_date->format('Y-m-d'));
                    $submittedAt = $end->copy()->subDays(10)->setTime(9, 0);
                    $verifiedAt = $end->copy()->subDays(4)->setTime(9, 0);
                    $lockedAt = $end->copy()->setTime(15, 0);

                    foreach ($subjects as $subject) {
                        $exists = SubjectGrade::where('student_id', $student->id)
                            ->where('semester_id', $semester->id)
                            ->where('subject_name', $subject)
                            ->exists();
                        if ($exists) {
                            $skippedRows++;
                            continue;
                        }

                        // Skor deterministik per siswa+tingkat+semester+mapel.
                        mt_srand(crc32("grade-history-{$student->nis}-{$level}-{$term}-{$academicYear}-{$subject}"));
                        $base = $clamp($ability + mt_rand(-6, 6));
                        $task = $clamp($base + mt_rand(-5, 7));
                        $midterm = $clamp($base + mt_rand(-8, 5));
                        $final = $clamp($base + mt_rand(-9, 6));

                        // Remedial hanya untuk sekitar 25% baris, selalu di
                        // atas nilai SAS baris itu.
                        $remedial = null;
                        if (mt_rand(1, 100) <= 25) {
                            $remedial = min(98, $final + mt_rand(3, 12));
                        }

                        SubjectGrade::create([
                            'id' => (string) Str::uuid(),
                            'student_id' => $student->id,
                            'student_nis' => $student->nis,
                            'student_name' => $student->name,
                            'class_name' => $histClass,
                            'subject_name' => $subject,
                            'semester_id' => $semester->id,
                            'teacher_id' => $teacherByClassSubject[$histClass . '|' . $subject] ?? null,
                            'task_score' => $task,
                            'midterm_score' => $midterm,
                            'remedial_score' => $remedial,
                            'final_score' => $final,
                            'final_total' => SubjectGrade::computeFinalTotal($task, $midterm, $remedial, $final),
                            'created_at' => $end->copy()->toIso8601String(),
                            'status' => SubjectGrade::STATUS_LOCKED,
                            'submitted_at' => $submittedAt,
                            'verified_at' => $verifiedAt,
                            'locked_at' => $lockedAt,
                        ]);
                        $inserted++;
                    }
                }
            }
        }

        // ---- (c) Hitung ulang semua final_total tersimpan ----------------
        $recomputed = 0;
        SubjectGrade::query()
            ->select(['id', 'task_score', 'midterm_score', 'remedial_score', 'final_score', 'final_total'])
            ->orderBy('id')
            ->chunk(500, function ($rows) use (&$recomputed) {
                foreach ($rows as $row) {
                    $newTotal = SubjectGrade::computeFinalTotal(
                        $row->task_score,
                        $row->midterm_score,
                        $row->remedial_score,
                        $row->final_score
                    );
                    if ($newTotal === null) {
                        continue;
                    }
                    if ($row->final_total === null || abs((float) $row->final_total - $newTotal) > 0.001) {
                        $row->final_total = $newTotal;
                        $row->save();
                        $recomputed++;
                    }
                }
            });

        $this->command->info("GradeHistorySeeder: {$createdSemesters} semester lampau dibuat.");
        $this->command->info("GradeHistorySeeder: {$inserted} baris nilai historis ditambahkan, {$skippedRows} baris sudah ada (dilewati), {$skippedStudents} siswa dilewati (nama kelas tidak dikenal).");
        $this->command->info("GradeHistorySeeder: {$recomputed} baris final_total dihitung ulang ke rumus berbobot.");
    }
}
