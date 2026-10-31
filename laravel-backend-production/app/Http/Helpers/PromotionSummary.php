<?php

namespace App\Http\Helpers;

use App\Models\SubjectGrade;

class PromotionSummary
{
    public const KKTP = 75;
    public const SUBJECT_COUNT = 9; // jumlah mapel SD

    /**
     * Ringkasan nilai seorang siswa pada satu semester: daftar nilai
     * per mapel, rata-rata, mapel di bawah KKTP, kelengkapan, dan
     * usulan keputusan sistem (naik/tinggal/belum-lengkap).
     * Keputusan akhir tetap di tangan wali kelas.
     */
    public static function forStudent(string $studentId, ?string $semesterId): array
    {
        $query = SubjectGrade::where('student_id', $studentId);
        if ($semesterId) {
            $query->where('semester_id', $semesterId);
        }
        $grades = $query->orderBy('subject_name')->get();

        $rows = [];
        $below = [];
        $sum = 0;
        $counted = 0;

        foreach ($grades as $g) {
            $total = $g->final_total !== null ? (float) $g->final_total : null;
            $rows[] = [
                'subject_name' => $g->subject_name,
                'final_total' => $total,
            ];
            if ($total !== null) {
                $sum += $total;
                $counted++;
                if ($total < self::KKTP) {
                    $below[] = ['subject_name' => $g->subject_name, 'final_total' => $total];
                }
            }
        }

        $average = $counted ? round($sum / $counted, 1) : null;
        $complete = $counted >= self::SUBJECT_COUNT;

        if (!$complete) {
            $proposal = 'belum-lengkap';
        } elseif ($average < self::KKTP || count($below) > 2) {
            $proposal = 'tinggal';
        } else {
            $proposal = 'naik';
        }

        return [
            'grades' => $rows,
            'average' => $average,
            'subjects_graded' => $counted,
            'subjects_total' => self::SUBJECT_COUNT,
            'complete' => $complete,
            'below_kktp' => $below,
            'proposal' => $proposal,
        ];
    }

    public static function reasonText(array $summary, string $decision): string
    {
        $avg = $summary['average'] !== null ? number_format($summary['average'], 1, ',', '.') : '-';
        if (!$summary['complete']) {
            return "Diputuskan manual oleh wali kelas; nilai belum lengkap ({$summary['subjects_graded']}/{$summary['subjects_total']} mapel), rata-rata sementara {$avg}.";
        }
        if (count($summary['below_kktp']) === 0) {
            return "Semua mapel tuntas (KKTP " . self::KKTP . "), rata-rata {$avg}.";
        }
        $parts = array_map(
            fn ($b) => $b['subject_name'] . ' (' . number_format($b['final_total'], 1, ',', '.') . ')',
            $summary['below_kktp']
        );
        return "Rata-rata {$avg}; mapel di bawah KKTP: " . implode(', ', $parts) . '.';
    }
}
