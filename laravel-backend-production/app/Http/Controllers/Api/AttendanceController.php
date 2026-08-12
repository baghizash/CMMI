<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AttendanceController extends Controller
{
    public function scan(Request $request)
    {
        $request->validate([
            'qr_code' => 'sometimes|string',
            'nis' => 'sometimes|string',
            'status' => 'sometimes|string',
            'mode' => 'sometimes|string',
            'recorded_by' => 'sometimes|string',
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
                'message' => "Siswa dengan kode/NIS '{$identifier}' tidak ditemukan."
            ], 404);
        }

        $existing = Attendance::where('student_id', $student->id)
            ->where('date', $todayStr)
            ->first();

        $mode = $request->mode ?? 'masuk';

        if ($mode === 'pulang') {
            if (!$existing) {
                return response()->json([
                    'success' => false,
                    'message' => "{$student->name} belum absen masuk hari ini, tidak bisa absen pulang."
                ], 400);
            }

            if ($existing->time_out) {
                return response()->json([
                    'success' => true,
                    'already' => true,
                    'message' => "{$student->name} sudah absen PULANG pukul {$existing->time_out}.",
                    'student' => $student,
                    'attendance' => $existing
                ]);
            }

            $existing->time_out = $timeStr;
            $existing->check_out_by = $request->recorded_by ?? 'Guru Piket';
            $existing->save();

            return response()->json([
                'success' => true,
                'already' => false,
                'message' => "✅ {$student->name} tercatat PULANG pukul {$timeStr}.",
                'student' => $student,
                'attendance' => $existing
            ]);
        }

        // mode === masuk
        if ($existing) {
            return response()->json([
                'success' => true,
                'already' => true,
                'message' => "{$student->name} ({$student->class_name}) sudah tercatat HADIR pukul {$existing->time}.",
                'student' => $student,
                'attendance' => $existing
            ]);
        }

        $status = $request->status ?? 'Hadir';
        if ($status === 'Hadir' && $timeStr > '07:15:00') {
            $status = 'Terlambat';
        }

        $attendance = Attendance::create([
            'id' => (string) Str::uuid(),
            'student_id' => $student->id,
            'nis' => $student->nis,
            'student_name' => $student->name,
            'class_name' => $student->class_name,
            'date' => $todayStr,
            'time' => $timeStr,
            'time_out' => null,
            'status' => $status,
            'recorded_by' => $request->recorded_by ?? 'Guru Piket',
            'created_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'already' => false,
            'message' => "Berhasil catat kehadiran: {$student->name} ({$student->class_name}) - {$status}",
            'student' => $student,
            'attendance' => $attendance
        ]);
    }

    public function index(Request $request)
    {
        $query = Attendance::query();

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('class_name') && $request->class_name !== 'Semua Kelas') {
            $query->where('class_name', $request->class_name);
        }

        if ($request->has('status') && $request->status !== 'Semua Status') {
            $query->where('status', $request->status);
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $records = $query->orderBy('time', 'desc')->get();
        return response()->json($records);
    }

    public function manual(Request $request)
    {
        $request->validate([
            'student_id' => 'required|string',
            'date' => 'sometimes|date',
            'status' => 'required|string',
            'notes' => 'nullable|string',
            'leave_type' => 'nullable|string',
            'recorded_by' => 'sometimes|string',
        ]);

        $student = Student::where('id', $request->student_id)->first();
        if (!$student) {
            return response()->json(['message' => 'Siswa tidak ditemukan.'], 404);
        }

        $todayStr = $request->date ?? now()->format('Y-m-d');
        $timeStr = now()->format('H:i:s');

        $existing = Attendance::where('student_id', $request->student_id)
            ->where('date', $todayStr)
            ->first();

        if ($existing) {
            $existing->update([
                'status' => $request->status,
                'notes' => $request->notes ?? $existing->notes,
                'leave_type' => $request->leave_type ?? $existing->leave_type,
                'recorded_by' => $request->recorded_by ?? 'Admin'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status diperbarui.',
                'attendance' => $existing
            ]);
        }

        $attendance = Attendance::create([
            'id' => (string) Str::uuid(),
            'student_id' => $student->id,
            'nis' => $student->nis,
            'student_name' => $student->name,
            'class_name' => $student->class_name,
            'date' => $todayStr,
            'time' => $timeStr,
            'time_out' => null,
            'status' => $request->status,
            'notes' => $request->notes ?? null,
            'leave_type' => $request->leave_type ?? null,
            'recorded_by' => $request->recorded_by ?? 'Admin',
            'created_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kehadiran dicatat.',
            'attendance' => $attendance
        ]);
    }

    public function destroy($id)
    {
        $attendance = Attendance::where('id', $id)->first();
        if (!$attendance) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        Attendance::where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Terhapus.'
        ]);
    }
}
