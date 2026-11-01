<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\SubjectGrade;
use App\Models\Student;
use App\Models\TeacherAssignment;
use App\Models\Semester;
use App\Http\Helpers\TeacherScope;

class SubjectGradeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = SubjectGrade::query();

        // Guru mapel: restrict to their assigned classes and subjects
        if ($user && $user->role === 'guru') {
            $assignedClasses = TeacherScope::getAssignedClasses($user);
            $assignedSubjects = TeacherScope::getAssignedSubjects($user);
            if ($assignedClasses !== null) {
                $query->whereIn('class_name', $assignedClasses);
            }
            if ($assignedSubjects !== null) {
                $query->whereIn('subject_name', $assignedSubjects);
            }
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('class_name')) {
            $query->where('class_name', $request->class_name);
        }
        if ($request->has('subject_name')) {
            $query->where('subject_name', $request->subject_name);
        }

        $records = $query->orderBy('subject_name')->get();
        return response()->json($records);
    }

    public function studentGrades(Request $request, $studentId)
    {
        $user = $request->user();

        // Guru mapel: verify student is in their assigned class
        if ($user && $user->role === 'guru') {
            $student = Student::find($studentId);
            if ($student) {
                $assignedClasses = TeacherScope::getAssignedClasses($user);
                if ($assignedClasses !== null && !in_array($student->class_name, $assignedClasses)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda tidak memiliki hak akses untuk melihat nilai siswa ini.'
                    ], 403);
                }
            }

            // Only return grades for teacher's assigned subjects
            $assignedSubjects = TeacherScope::getAssignedSubjects($user);
            $query = SubjectGrade::where('student_id', $studentId);
            if ($assignedSubjects !== null) {
                $query->whereIn('subject_name', $assignedSubjects);
            }
            return response()->json($query->get());
        }

        $grades = SubjectGrade::where('student_id', $studentId)->get();
        return response()->json($grades);
    }

    public function grouped(Request $request)
    {
        $request->validate([
            'class_name' => 'required|string',
            'subject_name' => 'required|string',
        ]);

        $user = $request->user();
        $className = $request->class_name;
        $subjectName = $request->subject_name;

        // If user is a teacher, verify scope assignment
        if ($user && $user->role === 'guru' && \Illuminate\Support\Facades\Schema::hasTable('teacher_assignments')) {
            $hasAccess = TeacherAssignment::where('class_name', $className)
                ->where('subject_name', $subjectName)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('username', $user->username)
                      ->orWhere('teacher_name', $user->name);
                })->exists();

            // If teacher assignments table has records for this teacher, enforce scope.
            $anyAssignment = TeacherAssignment::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('username', $user->username)
                  ->orWhere('teacher_name', $user->name);
            })->exists();

            if ($anyAssignment && !$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => "Anda tidak memiliki hak akses untuk menginput nilai kelas '{$className}' pada mata pelajaran '{$subjectName}'."
                ], 403);
            }
        }

        // Get all students in the requested class
        $students = Student::where('class_name', $className)->orderBy('name')->get();

        // Get existing grades for this class and subject (semester aktif)
        $gradeQuery = SubjectGrade::where('class_name', $className)
            ->where('subject_name', $subjectName);
        $activeSemesterId = Semester::activeId();
        if ($activeSemesterId) {
            $gradeQuery->where('semester_id', $activeSemesterId);
        }
        $existingGrades = $gradeQuery->get()->keyBy('student_id');

        $studentGradesData = $students->map(function ($st) use ($existingGrades) {
            $grade = $existingGrades->get($st->id);
            return [
                'student_id' => $st->id,
                'nis' => $st->nis,
                'name' => $st->name,
                'class_name' => $st->class_name,
                'task_score' => $grade ? $grade->task_score : null,
                'midterm_score' => $grade ? $grade->midterm_score : null,
                'remedial_score' => $grade ? $grade->remedial_score : null,
                'final_score' => $grade ? $grade->final_score : null,
                'final_total' => $grade ? $grade->final_total : null,
            ];
        });

        return response()->json([
            'success' => true,
            'class_name' => $className,
            'subject_name' => $subjectName,
            'students' => $studentGradesData
        ]);
    }

    public function batchStore(Request $request)
    {
        $request->validate([
            'class_name' => 'required|string',
            'subject_name' => 'required|string',
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|string',
        ]);

        $className = $request->class_name;
        $subjectName = $request->subject_name;
        $user = $request->user();

        // Guru mapel: verify access to this class+subject
        if ($user && $user->role === 'guru') {
            if (!TeacherScope::hasAccessToClassSubject($user, $className, $subjectName)) {
                return response()->json([
                    'success' => false,
                    'message' => "Anda tidak memiliki hak akses untuk menginput nilai kelas '{$className}' pada mapel '{$subjectName}'."
                ], 403);
            }
        }

        $savedCount = 0;

        foreach ($request->grades as $item) {
            $student = Student::find($item['student_id']);
            if (!$student) continue;

            $components = [];
            foreach (['task_score', 'midterm_score', 'remedial_score', 'final_score'] as $k) {
                if (isset($item[$k]) && $item[$k] !== '' && $item[$k] !== null) {
                    $components[] = floatval($item[$k]);
                }
            }

            $finalTotal = count($components) ? round(array_sum($components) / count($components), 1) : null;

            $gradeKey = [
                'student_id' => $student->id,
                'subject_name' => $subjectName,
            ];
            $activeSemesterId = Semester::activeId();
            if ($activeSemesterId) {
                $gradeKey['semester_id'] = $activeSemesterId;
            }

            SubjectGrade::updateOrCreate(
                $gradeKey,
                [
                    'id' => (string) Str::uuid(),
                    'student_nis' => $student->nis,
                    'student_name' => $student->name,
                    'class_name' => $className,
                    'teacher_id' => $user ? $user->id : null,
                    'task_score' => isset($item['task_score']) && $item['task_score'] !== '' ? floatval($item['task_score']) : null,
                    'midterm_score' => isset($item['midterm_score']) && $item['midterm_score'] !== '' ? floatval($item['midterm_score']) : null,
                    'remedial_score' => isset($item['remedial_score']) && $item['remedial_score'] !== '' ? floatval($item['remedial_score']) : null,
                    'final_score' => isset($item['final_score']) && $item['final_score'] !== '' ? floatval($item['final_score']) : null,
                    'final_total' => $finalTotal,
                    'created_at' => now()->toIso8601String(),
                ]
            );
            $savedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil menyimpan nilai {$savedCount} siswa untuk kelas '{$className}' - mapel '{$subjectName}'.",
            'count' => $savedCount
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|string',
            'subject_name' => 'required|string',
            'task_score' => 'numeric|nullable',
            'midterm_score' => 'numeric|nullable',
            'remedial_score' => 'numeric|nullable',
            'final_score' => 'numeric|nullable',
        ]);

        $student = Student::where('id', $request->student_id)->first();
        if (!$student) return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);

        // Guru mapel: verify access to this student's class + subject
        $user = $request->user();
        if ($user && $user->role === 'guru') {
            if (!TeacherScope::hasAccessToClassSubject($user, $student->class_name, $request->subject_name)) {
                return response()->json([
                    'success' => false,
                    'message' => "Anda tidak memiliki hak akses untuk menginput nilai siswa ini pada mapel '{$request->subject_name}'."
                ], 403);
            }
        }

        $components = [];
        foreach (['task_score', 'midterm_score', 'remedial_score', 'final_score'] as $k) {
            if ($request->filled($k) || $request->has($k)) $components[] = floatval($request->$k);
        }
        $finalTotal = count($components) ? array_sum($components) / count($components) : null;

        $gradeKey = ['student_id' => $request->student_id, 'subject_name' => $request->subject_name];
        $activeSemesterId = Semester::activeId();
        if ($activeSemesterId) {
            $gradeKey['semester_id'] = $activeSemesterId;
        }

        $grade = SubjectGrade::updateOrCreate(
            $gradeKey,
            [
                'id' => (string) Str::uuid(),
                'student_nis' => $student->nis,
                'student_name' => $student->name,
                'class_name' => $student->class_name,
                'teacher_id' => $request->user()->id ?? null,
                'task_score' => $request->task_score,
                'midterm_score' => $request->midterm_score,
                'remedial_score' => $request->remedial_score,
                'final_score' => $request->final_score,
                'final_total' => $finalTotal,
                'created_at' => now()->toIso8601String(),
            ]
        );

        return response()->json(['success' => true, 'grade' => $grade]);
    }
}
