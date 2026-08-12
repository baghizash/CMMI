<?php

namespace App\Http\Helpers;

use App\Models\TeacherAssignment;
use Illuminate\Support\Facades\Schema;

class TeacherScope
{
    /**
     * Get the list of class names assigned to a guru user.
     * Returns null if teacher_assignments table doesn't exist or user has no assignments.
     */
    public static function getAssignedClasses($user): ?array
    {
        if (!Schema::hasTable('teacher_assignments')) {
            return null;
        }

        $assignments = TeacherAssignment::where(function ($q) use ($user) {
            $q->where('user_id', (string)$user->id)
              ->orWhere('user_id', $user->id)
              ->orWhere('username', $user->username)
              ->orWhere('teacher_name', $user->name)
              ->orWhereRaw('LOWER(teacher_name) = ?', [strtolower($user->name)]);
        })->get();

        if ($assignments->isEmpty()) {
            return null;
        }

        return $assignments->pluck('class_name')->unique()->values()->toArray();
    }

    /**
     * Get the list of subject names assigned to a guru user.
     */
    public static function getAssignedSubjects($user): ?array
    {
        if (!Schema::hasTable('teacher_assignments')) {
            return null;
        }

        $assignments = TeacherAssignment::where(function ($q) use ($user) {
            $q->where('user_id', (string)$user->id)
              ->orWhere('user_id', $user->id)
              ->orWhere('username', $user->username)
              ->orWhere('teacher_name', $user->name)
              ->orWhereRaw('LOWER(teacher_name) = ?', [strtolower($user->name)]);
        })->get();

        if ($assignments->isEmpty()) {
            return null;
        }

        return $assignments->pluck('subject_name')->unique()->values()->toArray();
    }

    /**
     * Check if a guru has access to a specific class+subject pair.
     */
    public static function hasAccessToClassSubject($user, string $className, string $subjectName): bool
    {
        if (!Schema::hasTable('teacher_assignments')) {
            return true; // No table = no restrictions
        }

        // Check if teacher has ANY assignments at all
        $hasAnyAssignment = TeacherAssignment::where(function ($q) use ($user) {
            $q->where('user_id', (string)$user->id)
              ->orWhere('user_id', $user->id)
              ->orWhere('username', $user->username)
              ->orWhere('teacher_name', $user->name)
              ->orWhereRaw('LOWER(teacher_name) = ?', [strtolower($user->name)]);
        })->exists();

        if (!$hasAnyAssignment) {
            return true; // No assignments = no restrictions (teacher not yet configured)
        }

        return TeacherAssignment::where('class_name', $className)
            ->where('subject_name', $subjectName)
            ->where(function ($q) use ($user) {
                $q->where('user_id', (string)$user->id)
                  ->orWhere('user_id', $user->id)
                  ->orWhere('username', $user->username)
                  ->orWhere('teacher_name', $user->name)
                  ->orWhereRaw('LOWER(teacher_name) = ?', [strtolower($user->name)]);
            })->exists();
    }
}
