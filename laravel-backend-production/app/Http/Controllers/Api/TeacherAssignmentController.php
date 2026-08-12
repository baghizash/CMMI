<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TeacherAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $assignments = TeacherAssignment::orderBy('class_name')->get();
        return response()->json([
            'success' => true,
            'data' => $assignments
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable',
            'teacher_name' => 'required|string',
            'class_name' => 'required|string',
            'subject_name' => 'required|string',
        ]);

        $user = null;
        if ($request->user_id) {
            $user = User::find($request->user_id);
        } else {
            $user = User::where('name', $request->teacher_name)->first();
        }

        $existing = TeacherAssignment::where('class_name', $request->class_name)
            ->where('subject_name', $request->subject_name)
            ->where(function ($q) use ($request, $user) {
                if ($user) {
                    $q->where('user_id', $user->id);
                } else {
                    $q->where('teacher_name', $request->teacher_name);
                }
            })->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Penugasan guru untuk kelas dan mata pelajaran ini sudah ada.'
            ], 422);
        }

        $assignment = TeacherAssignment::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user ? $user->id : null,
            'username' => $user ? $user->username : null,
            'teacher_name' => $user ? $user->name : $request->teacher_name,
            'class_name' => $request->class_name,
            'subject_name' => $request->subject_name,
            'created_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penugasan guru berhasil ditambahkan.',
            'data' => $assignment
        ], 201);
    }

    public function destroy($id)
    {
        $assignment = TeacherAssignment::findOrFail($id);
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Penugasan berhasil dihapus.'
        ]);
    }

    public function myScope(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin' || !\Illuminate\Support\Facades\Schema::hasTable('teacher_assignments')) {
            return response()->json([
                'is_admin' => true,
                'classes' => [],
                'subjects' => [],
                'assignments' => []
            ]);
        }

        $assignments = TeacherAssignment::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
              ->orWhere('username', $user->username)
              ->orWhere('teacher_name', $user->name);
        })->get();

        $classes = $assignments->pluck('class_name')->unique()->values()->toArray();
        $subjects = $assignments->pluck('subject_name')->unique()->values()->toArray();

        return response()->json([
            'is_admin' => false,
            'classes' => $classes,
            'subjects' => $subjects,
            'assignments' => $assignments
        ]);
    }
}
