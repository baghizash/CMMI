<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomeroomTeacher extends Model
{
    protected $table = 'homeroom_teachers';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'user_id', 'username', 'teacher_name', 'class_name',
    ];

    // Apakah user ini wali kelas dari kelas tertentu?
    public static function isHomeroomOf($user, string $className): bool
    {
        if (!$user) return false;
        return static::where('class_name', $className)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('username', $user->username)
                  ->orWhere('teacher_name', $user->name);
            })->exists();
    }

    public static function classesOf($user): array
    {
        if (!$user) return [];
        return static::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
              ->orWhere('username', $user->username)
              ->orWhere('teacher_name', $user->name);
        })->pluck('class_name')->values()->toArray();
    }
}
