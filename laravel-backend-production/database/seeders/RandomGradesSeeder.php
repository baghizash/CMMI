<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\SubjectGrade;
use App\Models\TeacherAssignment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RandomGradesSeeder extends Seeder
{
    /**
     * Isi nilai acak untuk SEMUA siswa yang ada, untuk 9 mapel SD.
     * Nilai dibuat realistis: tiap siswa punya level kemampuan dasar,
     * komponen Tugas/STS/SAS berfluktuasi di sekitar level itu, dan
     * Remedial hanya muncul bila ada komponen di bawah KKTP (75),
     * PERSIS aturan hitung aplikasi saat ini: nilai akhir adalah
     * rata-rata polos komponen yang terisi (remedial ikut dirata-rata).
     * Aman dijalankan ulang: updateOrCreate per siswa+mapel dan
     * angka acaknya deterministik per siswa+mapel.
     */
    public function run(): void
    {
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

        $teacherByClassSubject = [];
        foreach (TeacherAssignment::all() as $a) {
            $teacherByClassSubject[$a->class_name . '|' . $a->subject_name] = $a->user_id;
        }

        $students = Student::all();
        $count = 0;

        foreach ($students as $student) {
            // Level kemampuan dasar siswa ini (konsisten antar mapel)
            mt_srand(crc32('ability-' . $student->nis));
            $ability = mt_rand(62, 97);

            foreach ($subjects as $subject) {
                mt_srand(crc32('grade-' . $student->nis . '-' . $subject));
                $base = max(45, min(99, $ability + mt_rand(-7, 7)));

                $clamp = function ($v) {
                    return max(40, min(100, $v));
                };

                $task = $clamp($base + mt_rand(-6, 8));
                $midterm = $clamp($base + mt_rand(-9, 5));
                $final = $clamp($base + mt_rand(-10, 6));

                $remedial = null;
                if (min($task, $midterm, $final) < 75 && mt_rand(1, 100) <= 85) {
                    $remedial = mt_rand(75, 88);
                }

                $components = array_filter(
                    [$task, $midterm, $remedial, $final],
                    fn ($v) => $v !== null
                );
                $finalTotal = round(array_sum($components) / count($components), 1);

                SubjectGrade::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'subject_name' => $subject,
                        'semester_id' => \App\Models\Semester::activeId(),
                    ],
                    [
                        'id' => (string) Str::uuid(),
                        'student_nis' => $student->nis,
                        'student_name' => $student->name,
                        'class_name' => $student->class_name,
                        'teacher_id' => $teacherByClassSubject[$student->class_name . '|' . $subject] ?? null,
                        'task_score' => $task,
                        'midterm_score' => $midterm,
                        'remedial_score' => $remedial,
                        'final_score' => $final,
                        'final_total' => $finalTotal,
                        'created_at' => now()->toIso8601String(),
                    ]
                );
                $count++;
            }
        }

        $this->command->info("Nilai acak dibuat: {$count} baris untuk " . $students->count() . " siswa x " . count($subjects) . " mapel.");
    }
}
