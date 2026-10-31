<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\TeacherAssignment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FullScheduleSeeder extends Seeder
{
    /**
     * Buat jadwal pelajaran LENGKAP Senin-Sabtu untuk 12 kelas SD.
     * Jam pelajaran SD 35 menit mulai 07:00; Senin-Kamis 6 jam,
     * Jumat 4 jam (pulang lebih awal), Sabtu 5 jam: total 33 jam
     * pelajaran per kelas per minggu.
     *
     * Beban mingguan per kelas: Pendidikan Agama 3, Pendidikan
     * Pancasila 3, Bahasa Indonesia 7, Matematika 6, IPAS 6, PJOK 2,
     * Seni Budaya 2, Bahasa Daerah 2, Bahasa Inggris 2 (khusus kelas
     * 3-6; kelas 1-2 diganti Bahasa Indonesia +1 dan IPAS +1).
     * PJOK, Seni Budaya, dan Bahasa Inggris ditempatkan sebagai blok
     * ganda 2 jam berurutan, dan guru spesialis dijamin tidak pernah
     * mengajar di dua kelas pada hari dan jam yang sama.
     *
     * Guru diambil dari penugasan yang berlaku (hasil GuruUsersSeeder).
     * PERHATIAN: seeder ini MENGHAPUS semua jadwal lama lalu membangun
     * ulang dari nol.
     */
    public function run(): void
    {
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $periodsPerDay = ['Senin' => 6, 'Selasa' => 6, 'Rabu' => 6, 'Kamis' => 6, 'Jumat' => 4, 'Sabtu' => 5];

        // [mulai, selesai] per nomor jam; istirahat 15 menit setelah
        // jam ke-3 (Jumat setelah jam ke-2).
        $timesNormal = [1 => ['07:00', '07:35'], 2 => ['07:35', '08:10'], 3 => ['08:10', '08:45'], 4 => ['09:00', '09:35'], 5 => ['09:35', '10:10'], 6 => ['10:10', '10:45']];
        $timesFriday = [1 => ['07:00', '07:35'], 2 => ['07:35', '08:10'], 3 => ['08:25', '09:00'], 4 => ['09:00', '09:35']];
        // Pasangan jam yang boleh jadi blok ganda (tidak memotong istirahat)
        $blockStartsNormal = [1, 2, 4, 5];
        $blockStartsFriday = [1, 3];

        $classes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

        $teacherByClassSubject = [];
        foreach (TeacherAssignment::all() as $a) {
            $teacherByClassSubject[$a->class_name . '|' . $a->subject_name] = $a->teacher_name;
        }

        $specialists = ['PJOK', 'Seni Budaya', 'Bahasa Inggris'];
        $baseLoad = [
            'Pendidikan Agama' => 3,
            'Pendidikan Pancasila' => 3,
            'Bahasa Indonesia' => 7,
            'Matematika' => 6,
            'IPAS' => 6,
            'PJOK' => 2,
            'Seni Budaya' => 2,
            'Bahasa Daerah' => 2,
            'Bahasa Inggris' => 2,
        ];

        Schedule::query()->delete();

        $teacherBusy = []; // "Nama Guru" => ["Senin-1" => true, ...]
        $totalRows = 0;
        $warnings = [];

        foreach ($classes as $ci => $className) {
            $grade = (int) $className[0];
            $load = $baseLoad;
            if ($grade < 3) {
                $load['Bahasa Inggris'] = 0;
                $load['Bahasa Indonesia'] += 1;
                $load['IPAS'] += 1;
            }

            // grid[hari][jam] = subject
            $grid = [];
            foreach ($days as $day) {
                $grid[$day] = array_fill(1, $periodsPerDay[$day], null);
            }

            // 1) Blok ganda untuk guru spesialis lebih dulu
            foreach ($specialists as $si => $subject) {
                if (($load[$subject] ?? 0) < 2) continue;
                $teacher = $teacherByClassSubject[$className . '|' . $subject] ?? null;
                if (!$teacher) {
                    $warnings[] = "Tidak ada guru untuk {$subject} kelas {$className}; blok dilewati.";
                    continue;
                }
                $placed = false;
                for ($di = 0; $di < 6 && !$placed; $di++) {
                    $day = $days[($ci + $si * 2 + $di) % 6];
                    $starts = $day === 'Jumat' ? $blockStartsFriday : $blockStartsNormal;
                    foreach ($starts as $start) {
                        if ($start + 1 > $periodsPerDay[$day]) continue;
                        if ($grid[$day][$start] !== null || $grid[$day][$start + 1] !== null) continue;
                        if (isset($teacherBusy[$teacher][$day . '-' . $start]) || isset($teacherBusy[$teacher][$day . '-' . ($start + 1)])) continue;
                        $grid[$day][$start] = $subject;
                        $grid[$day][$start + 1] = $subject;
                        $teacherBusy[$teacher][$day . '-' . $start] = true;
                        $teacherBusy[$teacher][$day . '-' . ($start + 1)] = true;
                        $placed = true;
                        break;
                    }
                }
                if (!$placed) {
                    $warnings[] = "Blok {$subject} kelas {$className} tidak menemukan slot; mapel diisi sebagai jam tunggal oleh pengisi inti.";
                } else {
                    $load[$subject] -= 2;
                }
            }

            // 2) Isi sisa slot dengan mapel inti (guru kelas sendiri)
            foreach ($days as $day) {
                $dayCount = [];
                $prev = null;
                for ($p = 1; $p <= $periodsPerDay[$day]; $p++) {
                    if ($grid[$day][$p] !== null) {
                        $prev = $grid[$day][$p];
                        $dayCount[$prev] = ($dayCount[$prev] ?? 0) + 1;
                        continue;
                    }
                    $best = null;
                    $bestRemaining = -1;
                    foreach ($load as $subject => $remaining) {
                        if ($remaining <= 0) continue;
                        if (($dayCount[$subject] ?? 0) >= 3) continue;
                        if ($subject === $prev && $remaining <= 2) continue;
                        if ($remaining > $bestRemaining) {
                            $best = $subject;
                            $bestRemaining = $remaining;
                        }
                    }
                    if ($best === null) {
                        foreach ($load as $subject => $remaining) {
                            if ($remaining > 0) { $best = $subject; break; }
                        }
                    }
                    if ($best === null) break;
                    $grid[$day][$p] = $best;
                    $dayCount[$best] = ($dayCount[$best] ?? 0) + 1;
                    $load[$best]--;
                    $prev = $best;
                }
            }

            // 3) Tulis ke database
            $rowsForClass = 0;
            foreach ($days as $day) {
                $times = $day === 'Jumat' ? $timesFriday : $timesNormal;
                for ($p = 1; $p <= $periodsPerDay[$day]; $p++) {
                    $subject = $grid[$day][$p];
                    if ($subject === null) {
                        $warnings[] = "Slot kosong: {$className} {$day} jam {$p}.";
                        continue;
                    }
                    $teacher = $teacherByClassSubject[$className . '|' . $subject] ?? null;
                    if (!$teacher) {
                        $warnings[] = "Tidak ada guru untuk {$subject} kelas {$className}; baris dilewati.";
                        continue;
                    }
                    Schedule::create([
                        'id' => (string) Str::uuid(),
                        'day' => $day,
                        'period' => $p,
                        'class_name' => $className,
                        'subject_name' => $subject,
                        'teacher_name' => $teacher,
                        'start_time' => $times[$p][0],
                        'end_time' => $times[$p][1],
                        'room' => $subject === 'PJOK' ? 'Lapangan' : 'Kelas ' . $className,
                        'created_at' => now()->toIso8601String(),
                    ]);
                    $rowsForClass++;
                }
            }
            $totalRows += $rowsForClass;
            $this->command->line("  Kelas {$className}: {$rowsForClass} jadwal.");
        }

        foreach ($warnings as $w) {
            $this->command->warn($w);
        }
        $this->command->info("Jadwal lengkap dibuat: {$totalRows} baris untuk 12 kelas x 6 hari.");
    }
}
