<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GuruPiket extends Model
{
    use HasFactory;

    protected $table = 'guru_piket';

    protected $fillable = [
        'id',
        'date',
        'teacher_name',
        'notes',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';
}
