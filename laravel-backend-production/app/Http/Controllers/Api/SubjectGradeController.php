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
    /**
     * Peran yang boleh memverifikasi, mengunci, dan membuka kunci nilai.
     * Pasangan admin-type yang dipakai di seluruh aplikasi (grup rute
     * "Admin & Kepsek"); peran admin murni bernama 'admin'. Kepala sekolah
     * termasuk karena halaman Nilai memang terarah ke kepsek dan
     * verifikasi nilai adalah tugas pengawasan akademiknya.
     */
    private const ADMIN_ROLES = ['admin', 'kepsek'];

    /**
     * Semester untuk operasi baca/tulis: semester_id eksplisit dari
     * request bila ada, selain itu semester aktif. Mengembalikan null
     * bila tidak ada semester aktif (perilaku lama: tanpa filter).
     */
    private function resolveSemesterId(Request $request): ?string
    {
        if ($request->filled('semester_id') && $request->semester_id !== 'all') {
            return $request->semester_id;
        }
        return Semester::activeId();
    }

    private function batchQuery(string $className, string $subjectName, ?string $semesterId)
    {
        $query = SubjectGrade::where('class_name', $className)
            ->where('subject_name', $subjectName);
        if ($semesterId) {
            $query->where('semester_id', $semesterId);
        }
        return $query;
    }

    /**
     * Status seragam sebuah batch, null bila batch belum punya baris,
     * atau 'mixed' bila baris-barisnya tidak seragam (tidak boleh terjadi;
     * transisi menolak keadaan ini agar diperbaiki lewat unlock admin).
     */
    private function batchStatus(string $className, string $subjectName, ?string $semesterId): ?string
    {
        $statuses = $this->batchQuery($className, $subjectName, $semesterId)
            ->distinct()->pluck('status');
        if ($statuses->isEmpty()) {
            return null;
        }
        return $statuses->count() === 1 ? $statuses->first() : 'mixed';
    }

    /**
     * Penjaga tulis: nilai hanya boleh diubah saat batch berstatus draft.
     * Mengembalikan response error bila terkunci oleh alur, null bila aman.
     */
    private function guardDraft(string $className, string $subjectName, ?string $semesterId)
    {
        $status = $this->batchStatus($className, $subjectName, $semesterId);
        if ($status !== null && $status !== SubjectGrade::STATUS_DRAFT) {
            return response()->json([
                'success' => false,
                'message' => "Nilai kelas '{$className}' mapel '{$subjectName}' berstatus '{$status}' dan tidak dapat diubah. Minta admin membuka kunci (kembali ke draft) terlebih dahulu.",
            ], 422);
        }
        return null;
    }

    private function scoreOrNull($item, string $key): ?float
    {
        return isset($item[$key]) && $item[$key] !== '' && $item[$key] !== null
            ? floatval($item[$key])
            : null;
    }

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

        // Konteks semester: eksplisit dari request, selain itu semester
        // aktif. semester_id=all menonaktifkan filter (akses arsip penuh).
        if ($request->get('semester_id') !== 'all') {
            $semesterId = $this->resolveSemesterId($request);
            if ($semesterId) {
                $query->where('semester_id', $semesterId);
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

        // Endpoint arsip per siswa: tanpa semester_id, semua semester
        // dikembalikan agar pemanggil (Detail Nilai) bisa mengelompokkan
        // per semester. semester_id eksplisit membatasi ke satu semester.
        $applySemester = function ($query) use ($request) {
            if ($request->filled('semester_id') && $request->semester_id !== 'all') {
                $query->where('semester_id', $request->semester_id);
            }
            return $query;
        };

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
            return response()->json($applySemester($query)->get());
        }

        $grades = $applySemester(SubjectGrade::where('student_id', $studentId))->get();
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

        // Semester konteks: eksplisit (arsip, hanya-lihat) atau aktif.
        $semesterId = $this->resolveSemesterId($request);
        $semester = $semesterId ? Semester::find($semesterId) : null;

        // Get existing grades for this class and subject in that semester
        $existingGrades = $this->batchQuery($className, $subjectName, $semesterId)
            ->get()->keyBy('student_id');

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
                'status' => $grade ? $grade->status : SubjectGrade::STATUS_DRAFT,
            ];
        });

        return response()->json([
            'success' => true,
            'class_name' => $className,
            'subject_name' => $subjectName,
            'semester' => $semester ? [
                'id' => $semester->id,
                'name' => $semester->name,
                'academic_year' => $semester->academic_year,
                'label' => $semester->label(),
                'is_active' => (bool) $semester->is_active,
            ] : null,
            'batch_status' => $this->batchStatus($className, $subjectName, $semesterId) ?? SubjectGrade::STATUS_DRAFT,
            'pass_threshold' => SubjectGrade::PASS_THRESHOLD,
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

        // Simpan selalu ke semester aktif (atau eksplisit), dan hanya
        // saat batch masih draft.
        $semesterId = $this->resolveSemesterId($request);
        if ($blocked = $this->guardDraft($className, $subjectName, $semesterId)) {
            return $blocked;
        }

        $savedCount = 0;

        foreach ($request->grades as $item) {
            $student = Student::find($item['student_id']);
            if (!$student) continue;

            $task = $this->scoreOrNull($item, 'task_score');
            $midterm = $this->scoreOrNull($item, 'midterm_score');
            $remedial = $this->scoreOrNull($item, 'remedial_score');
            $final = $this->scoreOrNull($item, 'final_score');

            $gradeKey = [
                'student_id' => $student->id,
                'subject_name' => $subjectName,
            ];
            if ($semesterId) {
                $gradeKey['semester_id'] = $semesterId;
            }

            SubjectGrade::updateOrCreate(
                $gradeKey,
                [
                    'id' => (string) Str::uuid(),
                    'student_nis' => $student->nis,
                    'student_name' => $student->name,
                    'class_name' => $className,
                    'teacher_id' => $user ? $user->id : null,
                    'task_score' => $task,
                    'midterm_score' => $midterm,
                    'remedial_score' => $remedial,
                    'final_score' => $final,
                    'final_total' => SubjectGrade::computeFinalTotal($task, $midterm, $remedial, $final),
                    'status' => SubjectGrade::STATUS_DRAFT,
                    'created_at' => now()->toIso8601String(),
                ]
            );
            $savedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil menyimpan draft nilai {$savedCount} siswa untuk kelas '{$className}' - mapel '{$subjectName}'.",
            'count' => $savedCount,
            'batch_status' => SubjectGrade::STATUS_DRAFT,
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

        $semesterId = $this->resolveSemesterId($request);
        if ($blocked = $this->guardDraft($student->class_name, $request->subject_name, $semesterId)) {
            return $blocked;
        }

        $gradeKey = ['student_id' => $request->student_id, 'subject_name' => $request->subject_name];
        if ($semesterId) {
            $gradeKey['semester_id'] = $semesterId;
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
                'final_total' => SubjectGrade::computeFinalTotal(
                    $request->task_score,
                    $request->midterm_score,
                    $request->remedial_score,
                    $request->final_score
                ),
                'status' => SubjectGrade::STATUS_DRAFT,
                'created_at' => now()->toIso8601String(),
            ]
        );

        return response()->json(['success' => true, 'grade' => $grade]);
    }

    // ------------------------------------------------------------------
    // Alur status batch: draft -> submitted -> verified -> locked.
    // Unlock (admin-type) mengembalikan batch ke draft dari status
    // terkirim/terverifikasi/terkunci. Setelah terkunci, tidak ada
    // perubahan nilai maupun transisi lain selain unlock admin.
    // ------------------------------------------------------------------

    public function submitBatch(Request $request)
    {
        return $this->transition($request, 'submit');
    }

    public function verifyBatch(Request $request)
    {
        return $this->transition($request, 'verify');
    }

    public function lockBatch(Request $request)
    {
        return $this->transition($request, 'lock');
    }

    public function unlockBatch(Request $request)
    {
        return $this->transition($request, 'unlock');
    }

    private function transition(Request $request, string $action)
    {
        $request->validate([
            'class_name' => 'required|string',
            'subject_name' => 'required|string',
        ]);

        $user = $request->user();
        $className = $request->class_name;
        $subjectName = $request->subject_name;
        $semesterId = $this->resolveSemesterId($request);

        $rules = [
            'submit' => [
                'from' => [SubjectGrade::STATUS_DRAFT],
                'to' => SubjectGrade::STATUS_SUBMITTED,
                'stamp' => 'submitted_at',
                'label' => 'dikirim',
            ],
            'verify' => [
                'from' => [SubjectGrade::STATUS_SUBMITTED],
                'to' => SubjectGrade::STATUS_VERIFIED,
                'stamp' => 'verified_at',
                'label' => 'diverifikasi',
            ],
            'lock' => [
                'from' => [SubjectGrade::STATUS_VERIFIED],
                'to' => SubjectGrade::STATUS_LOCKED,
                'stamp' => 'locked_at',
                'label' => 'dikunci',
            ],
            'unlock' => [
                'from' => [SubjectGrade::STATUS_SUBMITTED, SubjectGrade::STATUS_VERIFIED, SubjectGrade::STATUS_LOCKED],
                'to' => SubjectGrade::STATUS_DRAFT,
                'stamp' => null,
                'label' => 'dibuka kembali ke draft',
            ],
        ];
        $rule = $rules[$action];

        // Hak peran per transisi.
        if ($action === 'submit') {
            if ($user && $user->role === 'guru') {
                if (!TeacherScope::hasAccessToClassSubject($user, $className, $subjectName)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Anda tidak memiliki hak akses untuk mengirim nilai kelas '{$className}' pada mapel '{$subjectName}'.",
                    ], 403);
                }
            } elseif (!$user || !in_array($user->role, self::ADMIN_ROLES, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya guru pengampu atau admin yang dapat mengirim nilai.',
                ], 403);
            }
        } else {
            if (!$user || !in_array($user->role, self::ADMIN_ROLES, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya admin atau kepala sekolah yang dapat melakukan langkah ini.',
                ], 403);
            }
        }

        $status = $this->batchStatus($className, $subjectName, $semesterId);
        if ($status === null) {
            return response()->json([
                'success' => false,
                'message' => "Belum ada nilai tersimpan untuk kelas '{$className}' mapel '{$subjectName}' pada semester ini.",
            ], 422);
        }
        if (!in_array($status, $rule['from'], true)) {
            return response()->json([
                'success' => false,
                'message' => "Batch nilai berstatus '{$status}'; langkah ini mensyaratkan status '" . implode("' atau '", $rule['from']) . "'.",
            ], 422);
        }

        $updates = ['status' => $rule['to']];
        if ($rule['stamp']) {
            $updates[$rule['stamp']] = now();
        }
        if ($action === 'unlock') {
            $updates['submitted_at'] = null;
            $updates['verified_at'] = null;
            $updates['locked_at'] = null;
        }

        $count = $this->batchQuery($className, $subjectName, $semesterId)
            ->whereIn('status', $rule['from'])
            ->update($updates);

        return response()->json([
            'success' => true,
            'message' => "Nilai {$count} siswa kelas '{$className}' mapel '{$subjectName}' berhasil {$rule['label']}.",
            'count' => $count,
            'batch_status' => $rule['to'],
        ]);
    }
}
