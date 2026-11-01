<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\PromotionSummary;
use App\Models\HomeroomTeacher;
use App\Models\PromotionDecision;
use App\Models\Semester;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PromotionController extends Controller
{
    /**
     * Untuk wali kelas: kelas-kelas asuhannya beserta ringkasan nilai
     * semester aktif, usulan sistem, dan keputusan yang tersimpan.
     */
    public function myClasses(Request $request)
    {
        $user = $request->user();
        $semester = Semester::active();
        $classes = HomeroomTeacher::classesOf($user);

        $result = [];
        foreach ($classes as $className) {
            $students = Student::where('class_name', $className)
                ->where('status', 'aktif')
                ->orderBy('name')->get();

            $items = $students->map(function ($s) use ($semester) {
                $summary = PromotionSummary::forStudent($s->id, $semester ? $semester->id : null);
                $decision = $semester
                    ? PromotionDecision::where('student_id', $s->id)->where('semester_id', $semester->id)->first()
                    : null;
                return [
                    'student_id' => $s->id,
                    'nis' => $s->nis,
                    'name' => $s->name,
                    'class_name' => $s->class_name,
                    'summary' => $summary,
                    'decision' => $decision ? $decision->decision : null,
                    'decided_by_name' => $decision ? $decision->decided_by_name : null,
                ];
            });

            $result[] = ['class_name' => $className, 'students' => $items];
        }

        return response()->json([
            'success' => true,
            'semester' => $semester ? array_merge($semester->toArray(), ['label' => $semester->label()]) : null,
            'classes' => $result,
        ]);
    }

    /**
     * Simpan keputusan naik/tinggal untuk satu siswa pada semester
     * aktif. Hanya wali kelas dari kelas siswa itu (atau admin/kepsek).
     * Keputusan kelas 6 "naik" disimpan sebagai "lulus".
     */
    public function decide(Request $request)
    {
        $request->validate([
            'student_id' => 'required|string',
            'decision' => 'required|in:naik,tinggal,lulus',
        ]);

        $user = $request->user();
        $student = Student::find($request->student_id);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Siswa tidak ditemukan.'], 404);
        }

        $isManager = in_array($user->role, ['admin', 'kepsek']);
        if (!$isManager && !HomeroomTeacher::isHomeroomOf($user, $student->class_name)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda bukan wali kelas dari kelas siswa ini.',
            ], 403);
        }

        $semester = Semester::active();
        if (!$semester) {
            return response()->json(['success' => false, 'message' => 'Tidak ada semester aktif.'], 422);
        }

        $decision = $request->decision;
        if (preg_match('/^6[AB]$/', (string) $student->class_name) && $decision === 'naik') {
            $decision = 'lulus';
        }
        if ($decision === 'lulus' && !preg_match('/^6[AB]$/', (string) $student->class_name)) {
            return response()->json(['success' => false, 'message' => 'Keputusan lulus hanya untuk kelas 6.'], 422);
        }

        $summary = PromotionSummary::forStudent($student->id, $semester->id);

        $row = PromotionDecision::updateOrCreate(
            ['student_id' => $student->id, 'semester_id' => $semester->id],
            [
                'id' => (string) Str::uuid(),
                'class_name' => $student->class_name,
                'decision' => $decision,
                'decided_by' => $user->id,
                'decided_by_name' => $user->name,
                'reason' => PromotionSummary::reasonText($summary, $decision),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Keputusan untuk {$student->name}: " . strtoupper($decision) . '.',
            'data' => $row,
        ]);
    }

    /**
     * Untuk admin/kepsek: kemajuan keputusan per kelas pada semester
     * aktif, sebagai gerbang tombol Semester Baru mode tutup tahun.
     */
    public function status(Request $request)
    {
        $semester = Semester::active();
        $classes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

        $rows = [];
        $totalStudents = 0;
        $totalDecided = 0;

        foreach ($classes as $className) {
            $studentsCount = Student::where('class_name', $className)->where('status', 'aktif')->count();
            $decided = 0;
            if ($semester && $studentsCount > 0) {
                $ids = Student::where('class_name', $className)->where('status', 'aktif')->pluck('id');
                $decided = PromotionDecision::where('semester_id', $semester->id)
                    ->whereIn('student_id', $ids)->count();
            }
            $wali = HomeroomTeacher::where('class_name', $className)->first();
            $rows[] = [
                'class_name' => $className,
                'wali_kelas' => $wali ? $wali->teacher_name : null,
                'students' => $studentsCount,
                'decided' => $decided,
                'undecided' => $studentsCount - $decided,
            ];
            $totalStudents += $studentsCount;
            $totalDecided += $decided;
        }

        return response()->json([
            'success' => true,
            'semester' => $semester ? array_merge($semester->toArray(), ['label' => $semester->label()]) : null,
            'classes' => $rows,
            'total_students' => $totalStudents,
            'total_decided' => $totalDecided,
            'all_decided' => $totalStudents > 0 && $totalDecided >= $totalStudents,
        ]);
    }
}
