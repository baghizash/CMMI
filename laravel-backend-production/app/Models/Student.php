<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'nis',
        'name',
        'class_name',
        'gender',
        'photo_url',
        'qr_code',
        // Biodata lengkap (halaman detail siswa)
        'nisn',
        'nik',
        'no_kk',
        'birth_place',
        'birth_date',
        'religion',
        'address',
        'child_order',
        'siblings_count',
        'father_name',
        'father_job',
        'mother_name',
        'mother_job',
        'guardian_name',
        'parent_phone',
        'previous_school',
        'enrollment_year',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';
}
