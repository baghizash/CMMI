<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SdStudentsSeeder extends Seeder
{
    /**
     * Isi data siswa SD: kelas 1 sampai 6, masing-masing level 2 kelas
     * (A dan B), 20 siswa per kelas, total 240 siswa.
     *
     * Aman dijalankan berulang: siswa dikenali dari NIS (mulai 3001,
     * di luar rentang data demo lama) dan tidak diduplikasi.
     * Sebagian biodata ikut diisi (tempat/tanggal lahir, agama, alamat,
     * nama orang tua, no. HP, tahun masuk) supaya halaman detail dan
     * lencana kelengkapan biodata langsung terlihat hidup.
     */
    public function run(): void
    {
        $classes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];

        $boys = ['Andi', 'Budi', 'Cahyo', 'Dimas', 'Eko', 'Fajar', 'Galih', 'Hadi', 'Ilham', 'Joko', 'Krisna', 'Lukman', 'Made', 'Nanda', 'Oki', 'Putra', 'Rafi', 'Satria', 'Teguh', 'Umar', 'Vino', 'Wahyu', 'Yoga', 'Zaki', 'Bagas', 'Deni', 'Fikri', 'Hendra', 'Irfan', 'Raka'];
        $girls = ['Ani', 'Bunga', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hana', 'Intan', 'Juwita', 'Kartika', 'Lestari', 'Maya', 'Nadia', 'Oktavia', 'Putri', 'Ratna', 'Sari', 'Tiara', 'Utami', 'Vina', 'Wulan', 'Yuni', 'Zahra', 'Ayu', 'Diah', 'Fitria', 'Hesti', 'Indah', 'Rina'];
        $seconds = ['Pratama', 'Saputra', 'Nugraha', 'Ramadhan', 'Firmansyah', 'Hidayat', 'Saputri', 'Anggraini', 'Maharani', 'Puspita', 'Nugroho', 'Setiawan', 'Kusuma', 'Permata', 'Cahyani', 'Rahmawati', 'Prasetyo', 'Wibowo', 'Handoko', 'Salim', 'Nugraheni', 'Pangestu', 'Ramadhani', 'Safitri', 'Utama', 'Wahyuni', 'Kurniawan', 'Hartono', 'Syahputra', 'Melati'];
        $cities = ['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi', 'Bandung', 'Semarang', 'Yogyakarta', 'Surabaya', 'Malang', 'Solo', 'Cirebon'];
        $streets = ['Jl. Merdeka', 'Jl. Sudirman', 'Jl. Kenanga', 'Jl. Melati', 'Jl. Anggrek', 'Jl. Cendana', 'Jl. Flamboyan', 'Jl. Mawar', 'Jl. Dahlia', 'Jl. Teratai'];
        $fatherNames = ['Agus', 'Bambang', 'Cecep', 'Dedi', 'Edi', 'Fuad', 'Gunawan', 'Herman', 'Iwan', 'Jajang', 'Koko', 'Lili', 'Maman', 'Nanang', 'Oman', 'Pepen', 'Rudi', 'Slamet', 'Tatang', 'Udin'];
        $motherNames = ['Aminah', 'Beti', 'Cucu', 'Dedeh', 'Euis', 'Fitriah', 'Gina', 'Hj. Neneng', 'Iis', 'Juju', 'Kokom', 'Lilis', 'Mamah', 'Nani', 'Ocih', 'Popon', 'Rina', 'Siti', 'Tuti', 'Umi'];

        $nis = 3001;
        foreach ($classes as $ci => $className) {
            // Benih acak tetap per kelas: hasil antar-run konsisten.
            mt_srand(20261101 + $ci);
            $grade = (int) $className[0];
            $usedNames = [];

            for ($i = 0; $i < 20; $i++) {
                $isBoy = mt_rand(0, 1) === 0;
                $first = $isBoy ? $boys[mt_rand(0, count($boys) - 1)] : $girls[mt_rand(0, count($girls) - 1)];
                $second = $seconds[mt_rand(0, count($seconds) - 1)];
                $name = $first . ' ' . $second;
                $tries = 0;
                while (in_array($name, $usedNames) && $tries < 10) {
                    $second = $seconds[mt_rand(0, count($seconds) - 1)];
                    $name = $first . ' ' . $second;
                    $tries++;
                }
                $usedNames[] = $name;

                $nisStr = (string) $nis;
                if (!Student::where('nis', $nisStr)->exists()) {
                    $birthYear = 2020 - $grade; // kelas 1 ~ lahir 2019, kelas 6 ~ lahir 2014
                    Student::create([
                        'id' => (string) Str::uuid(),
                        'nis' => $nisStr,
                        'name' => $name,
                        'class_name' => $className,
                        'gender' => $isBoy ? 'L' : 'P',
                        'photo_url' => null,
                        'qr_code' => 'SCH-QR-' . $nisStr . '-' . strtoupper($first),
                        'birth_place' => $cities[mt_rand(0, count($cities) - 1)],
                        'birth_date' => sprintf('%04d-%02d-%02d', $birthYear, mt_rand(1, 12), mt_rand(1, 28)),
                        'religion' => 'Islam',
                        'address' => $streets[mt_rand(0, count($streets) - 1)] . ' No. ' . mt_rand(1, 120) . ', RT 0' . mt_rand(1, 9) . '/RW 0' . mt_rand(1, 9),
                        'father_name' => $fatherNames[mt_rand(0, count($fatherNames) - 1)] . ' ' . $seconds[mt_rand(0, count($seconds) - 1)],
                        'mother_name' => $motherNames[mt_rand(0, count($motherNames) - 1)] . ' ' . $seconds[mt_rand(0, count($seconds) - 1)],
                        'parent_phone' => '08' . mt_rand(11, 99) . mt_rand(1000, 9999) . mt_rand(1000, 9999),
                        'enrollment_year' => (string) (2027 - $grade),
                        'created_at' => now(),
                    ]);
                }
                $nis++;
            }
        }
    }
}
