<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'day',
        'period',
        'class_name',
        'subject_name',
        'teacher_name',
        'start_time',
        'end_time',
        'room',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';
}
