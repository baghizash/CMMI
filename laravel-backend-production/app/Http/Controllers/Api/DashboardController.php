<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\GuruPiket;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $targetDate = $request->date ?? now()->format('Y-m-d');

        $totalStudents = Student::count();
        $classes = Student::distinct('class_name')->pluck('class_name')->toArray();

        $attendanceToday = Attendance::where('date', $targetDate)->get();

        $hadirCount = $attendanceToday->filter(function ($a) {
            return in_array($a->status, ['Hadir', 'Terlambat']);
        })->count();

        $terlambatCount = $attendanceToday->filter(fn($a) => $a->status === 'Terlambat')->count();
        $sakitCount = $attendanceToday->filter(fn($a) => $a->status === 'Sakit')->count();
        $izinCount = $attendanceToday->filter(fn($a) => $a->status === 'Izin')->count();
        $alpaCount = $attendanceToday->filter(fn($a) => $a->status === 'Alpa')->count();
        $sudahPulang = $attendanceToday->filter(fn($a) => $a->time_out !== null)->count();

        $piket = GuruPiket::where('date', $targetDate)->first();

        $belumAbsen = max(0, $totalStudents - ($hadirCount + $sakitCount + $izinCount + $alpaCount));

        return response()->json([
            'date' => $targetDate,
            'total_students' => $totalStudents,
            'total_classes' => count($classes),
            'classes' => $classes,
            'hadir' => $hadirCount,
            'terlambat' => $terlambatCount,
            'sakit' => $sakitCount,
            'izin' => $izinCount,
            'alpa' => $alpaCount,
            'sudah_pulang' => $sudahPulang,
            'belum_absen' => $belumAbsen,
            'attendance_today' => $attendanceToday,
            'guru_piket_hari_ini' => $piket
        ]);
    }
}
