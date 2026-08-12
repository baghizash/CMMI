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

        $hadirCount = $attendanceToday->filter(fn($a) => $a->status === 'Hadir')->count();

        $terlambatCount = $attendanceToday->filter(fn($a) => $a->status === 'Terlambat')->count();
        $sakitCount = $attendanceToday->filter(fn($a) => $a->status === 'Sakit')->count();
        $izinCount = $attendanceToday->filter(fn($a) => $a->status === 'Izin')->count();
        $alpaCount = $attendanceToday->filter(fn($a) => $a->status === 'Alpa')->count();
        $sudahPulang = $attendanceToday->filter(fn($a) => $a->time_out !== null)->count();

        $piket = GuruPiket::where('date', $targetDate)->first();

        $belumAbsen = max(0, $totalStudents - ($hadirCount + $sakitCount + $izinCount + $alpaCount));

        // 7-day Weekly Trend Analytics
        $weeklyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $dt = \Carbon\Carbon::parse($targetDate)->subDays($i)->format('Y-m-d');
            $dayName = \Carbon\Carbon::parse($dt)->locale('id')->isoFormat('dd');
            $dayAtt = Attendance::where('date', $dt)->get();
            $weeklyTrend[] = [
                'date' => $dt,
                'day' => $dayName,
                'hadir' => $dayAtt->filter(fn($a) => in_array($a->status, ['Hadir', 'Terlambat']))->count(),
                'terlambat' => $dayAtt->filter(fn($a) => $a->status === 'Terlambat')->count(),
                'izin_sakit' => $dayAtt->filter(fn($a) => in_array($a->status, ['Sakit', 'Izin']))->count(),
                'alpa' => $dayAtt->filter(fn($a) => $a->status === 'Alpa')->count(),
            ];
        }

        // Attendance Percentage per Class
        $classAttendance = [];
        foreach ($classes as $cls) {
            $clsTotal = Student::where('class_name', $cls)->count();
            $clsHadir = Attendance::where('date', $targetDate)
                ->where('class_name', $cls)
                ->whereIn('status', ['Hadir', 'Terlambat'])
                ->count();
            $percentage = $clsTotal > 0 ? round(($clsHadir / $clsTotal) * 100, 1) : 0;
            $classAttendance[] = [
                'class_name' => $cls,
                'total' => $clsTotal,
                'hadir' => $clsHadir,
                'percentage' => $percentage,
            ];
        }

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
            'weekly_trend' => $weeklyTrend,
            'class_attendance' => $classAttendance,
            'attendance_today' => $attendanceToday,
            'guru_piket_hari_ini' => $piket
        ]);
    }
}
