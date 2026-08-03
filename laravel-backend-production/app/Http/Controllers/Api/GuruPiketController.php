<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuruPiket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GuruPiketController extends Controller
{
    public function index(Request $request)
    {
        $query = GuruPiket::query();

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        $records = $query->orderBy('date', 'desc')->get();
        return response()->json($records);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'teacher_name' => 'required|string',
            'notes' => 'sometimes|string',
        ]);

        $piket = GuruPiket::create([
            'id' => (string) Str::uuid(),
            'date' => $request->date,
            'teacher_name' => $request->teacher_name,
            'notes' => $request->notes ?? '',
            'created_at' => now()->toIso8601String(),
        ]);

        return response()->json($piket, 201);
    }

    public function destroy($id)
    {
        $piket = GuruPiket::where('id', $id)->first();
        if (!$piket) {
            return response()->json(['message' => 'Data piket tidak ditemukan.'], 404);
        }

        GuruPiket::where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data piket berhasil dihapus.'
        ]);
    }
}
