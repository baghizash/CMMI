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
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';
}
