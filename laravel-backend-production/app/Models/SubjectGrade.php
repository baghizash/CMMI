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

    /**
     * Ambang tuntas (KKTP). Satu-satunya tempat angka ini didefinisikan
     * untuk backend; predikat lulus memakai konstanta ini.
     */
    public const PASS_THRESHOLD = 75;

    // Alur status batch nilai.
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_LOCKED = 'locked';

    // Bobot nilai akhir: Tugas 20%, UTS 30%, UAS 50%.
    public const WEIGHT_TASK = 0.20;
    public const WEIGHT_MIDTERM = 0.30;
    public const WEIGHT_FINAL = 0.50;

    protected $fillable = [
        'id', 'student_id', 'student_nis', 'student_name', 'class_name', 'subject_name', 'semester_id', 'teacher_id',
        'task_score', 'midterm_score', 'remedial_score', 'final_score', 'final_total', 'created_at',
        'status', 'submitted_at', 'verified_at', 'locked_at'
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    /**
     * Nilai ujian efektif: remedial adalah pengulangan ujian akhir, jadi
     * bila remedial terisi dan lebih tinggi dari nilai UAS (atau UAS masih
     * kosong), remedial yang dipakai di dalam rumus. Kolom mentahnya tetap
     * tersimpan dan tampil apa adanya.
     */
    public static function effectiveFinalScore($remedialScore, $finalScore): ?float
    {
        $final = $finalScore === null ? null : (float) $finalScore;
        $remedial = $remedialScore === null ? null : (float) $remedialScore;

        if ($remedial !== null && ($final === null || $remedial > $final)) {
            return $remedial;
        }
        return $final;
    }

    /**
     * Nilai akhir berbobot, dihitung di server sebagai satu-satunya sumber
     * kebenaran: 0.20*tugas + 0.30*UTS + 0.50*UAS efektif. Komponen yang
     * kosong dikeluarkan dan bobot sisanya dinormalisasi proporsional.
     * Mengembalikan null bila semua komponen kosong.
     */
    public static function computeFinalTotal($taskScore, $midtermScore, $remedialScore, $finalScore): ?float
    {
        $parts = [];
        if ($taskScore !== null) {
            $parts[] = [self::WEIGHT_TASK, (float) $taskScore];
        }
        if ($midtermScore !== null) {
            $parts[] = [self::WEIGHT_MIDTERM, (float) $midtermScore];
        }
        $exam = self::effectiveFinalScore($remedialScore, $finalScore);
        if ($exam !== null) {
            $parts[] = [self::WEIGHT_FINAL, $exam];
        }

        if (count($parts) === 0) {
            return null;
        }

        $weightSum = array_sum(array_column($parts, 0));
        $scoreSum = 0.0;
        foreach ($parts as [$weight, $value]) {
            $scoreSum += $weight * $value;
        }

        return round($scoreSum / $weightSum, 1);
    }
}
