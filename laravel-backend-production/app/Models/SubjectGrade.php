<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubjectGrade extends Model
{
    use HasFactory;

    protected $table = 'subject_grades';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'student_id', 'student_nis', 'student_name', 'class_name', 'subject_name', 'teacher_id',
        'task_score', 'midterm_score', 'remedial_score', 'final_score', 'final_total', 'created_at'
    ];
}
