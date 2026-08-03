<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\SubjectAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::query();

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

    public function store(Request $request)
    {
        $request->validate([
            'nis' => 'required|string|unique:students',
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
            'photo_url' => 'sometimes|string',
        ]);

        $student->update($request->only(['nis', 'name', 'class_name', 'gender', 'photo_url']));

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

    public function seedDemo()
    {
        Student::truncate();
        Attendance::truncate();
        SubjectAttendance::truncate();

        $classes = ["X IPA 1", "X IPA 2", "XI IPS 1", "XI IPS 2", "XII MIPA"];
        $names = [
            ["Ahmad Fauzi", "L"], ["Siti Rahma", "P"], ["Budi Santoso", "L"],
            ["Dewi Lestari", "P"], ["Eko Prasetyo", "L"], ["Rina Melati", "P"],
            ["Joko Widodo", "L"], ["Sri Mulyani", "P"], ["Andi Pratama", "L"],
            ["Maya Sari", "P"], ["Doni Kusuma", "L"], ["Siska Amelia", "P"]
        ];

        $seeded = [];
        $nisCounter = 1001;

        foreach ($names as $idx => [$name, $gender]) {
            $cls = $classes[$idx % count($classes)];
            $nis = (string) $nisCounter++;
            $qr = "SCH-QR-{$nis}-" . strtoupper(explode(' ', $name)[0]);

            $student = Student::create([
                'id' => (string) Str::uuid(),
                'nis' => $nis,
                'name' => $name,
                'class_name' => $cls,
                'gender' => $gender,
                'photo_url' => '',
                'qr_code' => $qr,
                'created_at' => now()->toIso8601String(),
            ]);

            $seeded[] = $student;
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil generate " . count($seeded) . " siswa demo.",
            'count' => count($seeded)
        ]);
    }
}
