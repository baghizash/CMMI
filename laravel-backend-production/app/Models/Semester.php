<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    protected $table = 'semesters';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'academic_year', 'start_date', 'end_date', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
    ];

    public function label(): string
    {
        return $this->name . ' ' . $this->academic_year;
    }

    public static function active(): ?self
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('semesters')) {
            return null;
        }
        return static::where('is_active', true)->first();
    }

    public static function activeId(): ?string
    {
        $active = static::active();
        return $active ? $active->id : null;
    }
}
