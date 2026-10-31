<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\SubjectAttendance;
use App\Http\Helpers\TeacherScope;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Student::query();

        // Guru mapel: only show students in their assigned classes
        if ($user && $user->role === 'guru') {
            $assignedClasses = TeacherScope::getAssignedClasses($user);
            if ($assignedClasses !== null) {
                $query->whereIn('class_name', $assignedClasses);
            }
        }

        if ($request->has('class_name') && $request->class_name !== 'Semua Kelas') {
            $query->where('class_name', $request->class_name);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw("LOWER(name) LIKE ?", ["%".strtolower($search)."%"])
                  ->orWhereRaw("LOWER(nis) LIKE ?", ["%".strtolower($search)."%"])
                  ->orWhereRaw("LOWER(qr_code) LIKE ?", ["%".strtolower($search)."%"]);
            });
        }

        $data = $query->get();
        \Log::info('StudentController.index - query result count: ' . $data->count());
        return response()->json($data);
    }

    public function show(Request $request, $id)
    {
        $student = Student::where('id', $id)->first();
        if (!$student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        // Guru mapel: only students in their assigned classes (same scope as index)
        $user = $request->user();
        if ($user && $user->role === 'guru') {
            $assignedClasses = TeacherScope::getAssignedClasses($user);
            if ($assignedClasses !== null && !in_array($student->class_name, $assignedClasses)) {
                return response()->json(['message' => 'Anda tidak memiliki akses ke siswa ini.'], 403);
            }
        }

        return response()->json($student);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Guru mapel: can only add students to their assigned classes
        if ($user && $user->role === 'guru') {
            $assignedClasses = TeacherScope::getAssignedClasses($user);
            if ($assignedClasses !== null && !in_array($request->class_name, $assignedClasses)) {
                return response()->json([
                    'success' => false,
                    'message' => "Anda tidak memiliki hak akses untuk menambah siswa ke kelas '{$request->class_name}'."
                ], 403);
            }
        }

        $existing = Student::where('nis', $request->nis)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'NIS sudah digunakan.'
            ], 400);
        }

        $request->validate([
            'nis' => 'required|string',
            'name' => 'required|string',
            'class_name' => 'required|string',
            'gender' => 'required|string',
            'photo_url' => 'nullable|string',
        ]);

        try {
            $student = Student::create([
                'id' => (string) Str::uuid(),
                'nis' => $request->nis,
                'name' => $request->name,
                'class_name' => $request->class_name,
                'gender' => $request->gender,
                'photo_url' => $request->photo_url ?? null,
                'qr_code' => 'SCH-QR-' . strtoupper(Str::random(12)),
            ]);

            return response()->json([
                'id' => $student->id,
                'nis' => $student->nis,
                'name' => $student->name,
                'class_name' => $student->class_name,
                'gender' => $student->gender,
                'qr_code' => $student->qr_code,
                'success' => true,
                'data' => $student,
                'message' => 'Siswa berhasil ditambahkan.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $student = Student::where('id', $id)->first();
        if (!$student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        $request->validate([
            'nis' => 'sometimes|string',
            'name' => 'sometimes|string',
            'class_name' => 'sometimes|string',
            'gender' => 'sometimes|string',
            'photo_url' => 'sometimes|nullable|string',
            // Biodata lengkap (halaman detail siswa)
            'nisn' => 'sometimes|nullable|string',
            'nik' => 'sometimes|nullable|string',
            'no_kk' => 'sometimes|nullable|string',
            'birth_place' => 'sometimes|nullable|string',
            'birth_date' => 'sometimes|nullable|date',
            'religion' => 'sometimes|nullable|string',
            'address' => 'sometimes|nullable|string',
            'child_order' => 'sometimes|nullable|integer|min:0',
            'siblings_count' => 'sometimes|nullable|integer|min:0',
            'father_name' => 'sometimes|nullable|string',
            'father_job' => 'sometimes|nullable|string',
            'mother_name' => 'sometimes|nullable|string',
            'mother_job' => 'sometimes|nullable|string',
            'guardian_name' => 'sometimes|nullable|string',
            'parent_phone' => 'sometimes|nullable|string',
            'previous_school' => 'sometimes|nullable|string',
            'enrollment_year' => 'sometimes|nullable|string',
        ]);

        $student->update($request->only([
            'nis', 'name', 'class_name', 'gender', 'photo_url',
            'nisn', 'nik', 'no_kk', 'birth_place', 'birth_date', 'religion',
            'address', 'child_order', 'siblings_count', 'father_name',
            'father_job', 'mother_name', 'mother_job', 'guardian_name',
            'parent_phone', 'previous_school', 'enrollment_year',
        ]));

        return response()->json($student);
    }

    public function destroy($id)
    {
        $student = Student::where('id', $id)->first();
        if (!$student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        Student::where('id', $id)->delete();
        Attendance::where('student_id', $id)->delete();
        SubjectAttendance::where('student_id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Siswa berhasil dihapus.'
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'students' => 'required|array',
            'students.*.nis' => 'required|string',
            'students.*.name' => 'required|string',
            'students.*.class_name' => 'required|string',
            'students.*.gender' => 'nullable|string',
        ]);

        $studentsData = $request->students;
        $imported = 0;
        $skipped = 0;

        foreach ($studentsData as $item) {
            $existing = Student::where('nis', $item['nis'])->first();
            if ($existing) {
                $skipped++;
                continue;
            }

            Student::create([
                'id' => (string) Str::uuid(),
                'nis' => $item['nis'],
                'name' => $item['name'],
                'class_name' => $item['class_name'],
                'gender' => isset($item['gender']) && strtoupper($item['gender']) === 'P' ? 'P' : 'L',
                'photo_url' => $item['photo_url'] ?? '',
                'qr_code' => 'SCH-QR-' . strtoupper(Str::random(12)),
            ]);
            $imported++;
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil mengimpor {$imported} siswa. ({$skipped} dilewati karena NIS sudah ada)",
            'imported_count' => $imported,
            'skipped_count' => $skipped
        ]);
    }

    public function promoteClass(Request $request)
    {
        $request->validate([
            'from_class' => 'required|string',
            'to_class' => 'required|string',
        ]);

        $updated = Student::where('class_name', $request->from_class)
            ->update(['class_name' => $request->to_class]);

        return response()->json([
            'success' => true,
            'message' => "Berhasil memindahkan {$updated} siswa dari kelas '{$request->from_class}' ke '{$request->to_class}'.",
            'updated_count' => $updated
        ]);
    }
}
