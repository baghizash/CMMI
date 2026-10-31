<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromotionDecision;
use App\Models\Semester;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        $semesters = Semester::orderBy('start_date')->get()->map(function ($s) {
            return array_merge($s->toArray(), ['label' => $s->label()]);
        });
        return response()->json(['success' => true, 'data' => $semesters]);
    }

    public function active(Request $request)
    {
        $active = Semester::active();
        return response()->json([
            'success' => true,
            'data' => $active ? array_merge($active->toArray(), ['label' => $active->label()]) : null,
        ]);
    }

    /**
     * Tombol "Semester Baru" milik admin. Dua mode:
     * - semester: hanya mengganti semester aktif (tengah tahun ajaran,
     *   tidak ada siswa yang berpindah).
     * - tahun: tutup tahun ajaran. Gerbang: semua siswa aktif pola
     *   kelas SD harus sudah diputuskan wali kelasnya untuk semester
     *   yang ditutup. Keputusan dijalankan serentak: naik -> kelas
     *   berikutnya, lulus (kelas 6) -> alumni, tinggal -> tetap.
     */
    public function rollover(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'academic_year' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'mode' => 'required|in:semester,tahun',
        ]);

        $current = Semester::active();
        $summary = ['promoted' => 0, 'retained' => 0, 'graduated' => 0, 'skipped' => 0];

        if ($request->mode === 'tahun') {
            if (!$current) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada semester aktif yang bisa ditutup.',
                ], 422);
            }

            $students = Student::where('status', 'aktif')->get()
                ->filter(fn ($s) => preg_match('/^([1-6])([AB])$/', (string) $s->class_name));

            $decisions = PromotionDecision::where('semester_id', $current->id)
                ->get()->keyBy('student_id');

            $undecidedByClass = [];
            foreach ($students as $s) {
                if (!$decisions->has($s->id)) {
                    $undecidedByClass[$s->class_name] = ($undecidedByClass[$s->class_name] ?? 0) + 1;
                }
            }

            if (!empty($undecidedByClass)) {
                $total = array_sum($undecidedByClass);
                return response()->json([
                    'success' => false,
                    'message' => "Tahun ajaran belum bisa ditutup: masih ada {$total} siswa yang belum diputuskan wali kelasnya.",
                    'undecided_by_class' => $undecidedByClass,
                ], 422);
            }

            DB::transaction(function () use ($students, $decisions, &$summary) {
                foreach ($students as $s) {
                    $decision = $decisions->get($s->id)->decision;
                    preg_match('/^([1-6])([AB])$/', (string) $s->class_name, $m);
                    $grade = (int) $m[1];
                    $section = $m[2];

                    if ($decision === 'tinggal') {
                        $summary['retained']++;
                    } elseif ($grade === 6) {
                        $s->status = 'alumni';
                        $s->save();
                        $summary['graduated']++;
                    } else {
                        $s->class_name = ($grade + 1) . $section;
                        $s->save();
                        $summary['promoted']++;
                    }
                }
            });
        }

        DB::transaction(function () use ($request, $current) {
            if ($current) {
                $current->is_active = false;
                $current->save();
            }
            Semester::create([
                'id' => (string) Str::uuid(),
                'name' => $request->name,
                'academic_year' => $request->academic_year,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'is_active' => true,
            ]);
        });

        $new = Semester::active();

        return response()->json([
            'success' => true,
            'message' => $request->mode === 'tahun'
                ? "Tahun ajaran ditutup dan semester {$new->label()} dimulai. {$summary['promoted']} siswa naik kelas, {$summary['graduated']} siswa lulus menjadi alumni, {$summary['retained']} siswa tinggal kelas."
                : "Semester {$new->label()} dimulai. Tidak ada siswa yang berpindah kelas.",
            'summary' => $summary,
            'data' => $new ? array_merge($new->toArray(), ['label' => $new->label()]) : null,
        ]);
    }
}
