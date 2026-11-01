<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendance';

    protected $fillable = [
        'id',
        'student_id',
        'nis',
        'student_name',
        'class_name',
        'date',
        'semester_id',
        'time',
        'time_out',
        'check_out_by',
        'status',
        'notes',
        'leave_type',
        'recorded_by',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';
}
