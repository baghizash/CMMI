<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\SubjectAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubjectAttendanceController extends Controller
{
    public function scan(Request $request)
    {
        $request->validate([
            'qr_code' => 'sometimes|string',
            'nis' => 'sometimes|string',
            'subject_name' => 'required|string',
            'period' => 'required|integer',
            'teacher_name' => 'required|string',
            'status' => 'sometimes|string',
        ]);

        $now = now();
        $todayStr = $now->format('Y-m-d');
        $timeStr = $now->format('H:i:s');

        $identifier = $request->qr_code ?? $request->nis;
        if (!$identifier) {
            return response()->json([
                'success' => false,
                'message' => 'QR Code atau NIS wajib diisi.'
            ], 400);
        }

        $student = Student::where(function ($q) use ($identifier) {
            $q->where('qr_code', $identifier)
              ->orWhere('nis', $identifier);
        })->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => "Siswa '{$identifier}' tidak ditemukan."
            ], 404);
        }

        $existing = SubjectAttendance::where('student_id', $student->id)
            ->where('date', $todayStr)
            ->where('subject_name', $request->subject_name)
            ->where('period', $request->period)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'already' => true,
                'message' => "{$student->name} sudah scan {$request->subject_name} jam ke-{$request->period} pukul {$existing->time}.",
                'student' => $student,
                'record' => $existing
            ]);
        }

        $record = SubjectAttendance::create([
            'id' => (string) Str::uuid(),
            'student_id' => $student->id,
            'nis' => $student->nis,
            'student_name' => $student->name,
            'class_name' => $student->class_name,
            'date' => $todayStr,
            'time' => $timeStr,
            'subject_name' => $request->subject_name,
            'period' => $request->period,
            'teacher_name' => $request->teacher_name,
            'status' => $request->status ?? 'Hadir',
            'created_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'already' => false,
            'message' => "✅ {$student->name} tercatat hadir di {$request->subject_name} jam ke-{$request->period}.",
            'student' => $student,
            'record' => $record
        ]);
    }

    public function index(Request $request)
    {
        $query = SubjectAttendance::query();

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('class_name') && $request->class_name !== 'Semua Kelas') {
            $query->where('class_name', $request->class_name);
        }

        if ($request->has('subject_name')) {
            $query->where('subject_name', $request->subject_name);
        }

        if ($request->has('period')) {
            $query->where('period', $request->period);
        }

        $records = $query->orderBy('time', 'desc')->get();
        return response()->json($records);
    }
}
