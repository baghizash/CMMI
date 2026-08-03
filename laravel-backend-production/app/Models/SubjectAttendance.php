<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SubjectAttendance extends Model
{
    use HasFactory;

    protected $table = 'subject_attendance';

    protected $fillable = [
        'id',
        'student_id',
        'nis',
        'student_name',
        'class_name',
        'date',
        'time',
        'subject_name',
        'period',
        'teacher_name',
        'status',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';
}
