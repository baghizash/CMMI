<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Semester;
use App\Models\Student;
use App\Models\SubjectGrade;
use App\Http\Helpers\TeacherScope;

/**
 * Tampilan orang tua (hanya-lihat): nilai satu siswa per semester dengan
 * komponen lengkap, persis seperti yang kelak dilihat orang tua.
 *
 * CATATAN KEKOSONGAN: saat ini BELUM ada peran akun orang tua dan belum
 * ada tautan akun-ke-siswa di basis data (users hanya berisi admin,
 * kepsek, guru; students hanya menyimpan parent_phone sebagai biodata).
 * Endpoint ini karena itu dijaga mekanisme terdekat yang sudah ada:
 * login staf (auth:sanctum semua peran, guru dibatasi scope kelasnya),
 * sebagai pratinjau staf. Keputusan yang dibutuhkan sebelum orang tua
 * bisa login sendiri: buat peran 'orang_tua' + kolom tautan
 * (mis. students.parent_user_id atau tabel pivot) dan aturan verifikasi
 * kepemilikan anak.
 *
 * Tugas/agenda harian TIDAK disertakan: belum ada model tugas di
 * aplikasi (Schedule adalah jadwal pelajaran kelas, bukan tugas siswa).
 */
class ParentViewController extends Controller
{
    public function show(Request $request, $studentId)
    {
        $student = Student::find($studentId);
        if (!$student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        $user = $request->user();
        if ($user && $user->role === 'guru') {
            $assignedClasses = TeacherScope::getAssignedClasses($user);
            if ($assignedClasses !== null && !in_array($student->class_name, $assignedClasses)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak akses untuk melihat data siswa ini.',
                ], 403);
            }
        }

        $blocks = [];
        foreach (Semester::orderBy('start_date')->get() as $semester) {
            $grades = SubjectGrade::where('student_id', $student->id)
                ->where('semester_id', $semester->id)
                ->orderBy('subject_name')
                ->get()
                ->map(function ($g) {
                    return [
                        'id' => $g->id,
                        'subject_name' => $g->subject_name,
                        'task_score' => $g->task_score,
                        'midterm_score' => $g->midterm_score,
                        'remedial_score' => $g->remedial_score,
                        'final_score' => $g->final_score,
                        'final_total' => $g->final_total,
                        'status' => $g->status,
                        'passed' => $g->final_total !== null
                            ? (float) $g->final_total >= SubjectGrade::PASS_THRESHOLD
                            : null,
                    ];
                });

            $blocks[] = [
                'semester' => [
                    'id' => $semester->id,
                    'name' => $semester->name,
                    'academic_year' => $semester->academic_year,
                    'label' => $semester->label(),
                    'is_active' => (bool) $semester->is_active,
                ],
                'grades' => $grades,
            ];
        }

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $student->id,
                'nis' => $student->nis,
                'name' => $student->name,
                'class_name' => $student->class_name,
                'gender' => $student->gender,
            ],
            'pass_threshold' => SubjectGrade::PASS_THRESHOLD,
            'semesters' => $blocks,
            // Belum ada model tugas/agenda siswa di aplikasi.
            'tasks' => null,
        ]);
    }
}
