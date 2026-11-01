<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomeroomTeacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HomeroomTeacherController extends Controller
{
    public function index(Request $request)
    {
        $rows = HomeroomTeacher::orderBy('class_name')->get();
        return response()->json(['success' => true, 'data' => $rows]);
    }

    // Satu kelas satu wali: menugaskan berarti mengganti wali lama.
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable',
            'teacher_name' => 'required|string',
            'class_name' => 'required|string',
        ]);

        $user = null;
        if ($request->user_id) {
            $user = User::find($request->user_id);
        } else {
            $user = User::where('name', $request->teacher_name)->first();
        }

        $row = HomeroomTeacher::updateOrCreate(
            ['class_name' => $request->class_name],
            [
                'id' => (string) Str::uuid(),
                'user_id' => $user ? $user->id : null,
                'username' => $user ? $user->username : null,
                'teacher_name' => $user ? $user->name : $request->teacher_name,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Wali kelas {$request->class_name} sekarang {$row->teacher_name}.",
            'data' => $row,
        ], 201);
    }

    public function destroy($id)
    {
        $row = HomeroomTeacher::findOrFail($id);
        $row->delete();

        return response()->json([
            'success' => true,
            'message' => 'Penugasan wali kelas dihapus.',
        ]);
    }
}
