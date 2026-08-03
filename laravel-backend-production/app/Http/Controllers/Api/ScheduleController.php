<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::query();

        if ($request->has('class_name') && $request->class_name !== 'Semua Kelas') {
            $query->where('class_name', $request->class_name);
        }

        if ($request->has('day')) {
            $query->where('day', $request->day);
        }

        $records = $query->orderBy('period', 'asc')->get();
        return response()->json($records);
    }

    public function store(Request $request)
    {
        $request->validate([
            'day' => 'required|string',
            'period' => 'required|integer',
            'class_name' => 'required|string',
            'subject_name' => 'required|string',
            'teacher_name' => 'required|string',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'room' => 'sometimes|string',
        ]);

        $schedule = Schedule::create([
            'id' => (string) Str::uuid(),
            'day' => $request->day,
            'period' => $request->period,
            'class_name' => $request->class_name,
            'subject_name' => $request->subject_name,
            'teacher_name' => $request->teacher_name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'room' => $request->room ?? '',
            'created_at' => now()->toIso8601String(),
        ]);

        return response()->json($schedule, 201);
    }

    public function destroy($id)
    {
        $schedule = Schedule::where('id', $id)->first();
        if (!$schedule) {
            return response()->json(['message' => 'Jadwal tidak ditemukan.'], 404);
        }

        Schedule::where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus.'
        ]);
    }
}
