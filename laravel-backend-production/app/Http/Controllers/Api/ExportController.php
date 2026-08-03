<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    public function excel(Request $request)
    {
        $query = Attendance::query();

        if ($request->has('date')) {
            $query->where('date', $request->date);
        } elseif ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        if ($request->has('class_name') && $request->class_name !== 'Semua Kelas') {
            $query->where('class_name', $request->class_name);
        }

        $records = $query->orderBy('date', 'desc')->get()->toArray();

        // Prepare export data
        $data = [];
        foreach ($records as $idx => $record) {
            $data[] = [
                'No' => $idx + 1,
                'Tanggal' => $record['date'],
                'NIS' => $record['nis'],
                'Nama Siswa' => $record['student_name'],
                'Kelas' => $record['class_name'],
                'Jam Masuk' => $record['time'],
                'Jam Pulang' => $record['time_out'] ?? '-',
                'Status' => $record['status'],
                'Pencatat' => $record['recorded_by'],
            ];
        }

        $filename = 'rekap_kehadiran_' . ($request->date ?? $request->start_date ?? now()->format('Y-m-d')) . '.xlsx';

        return Excel::download(new \App\Exports\AttendanceExport($data), $filename);
    }
}
