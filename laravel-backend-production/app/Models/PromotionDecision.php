<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromotionDecision extends Model
{
    protected $table = 'promotion_decisions';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'student_id', 'semester_id', 'class_name', 'decision',
        'decided_by', 'decided_by_name', 'reason',
    ];
}
