# Daftar Akun Pengguna CMMI Absensi

Diperbarui: 1 November 2026 (setelah sistem dialihkan ke SD dan seeder guru dijalankan)

Catatan penting:

- File ini tersimpan di repo GitHub privat CMMI (branch fitur/halaman-detail-siswa) atas permintaan Baghiz. Jaga kerahasiaannya.
- Akun guru di bawah dibuat oleh `GuruUsersSeeder`. Jalankan seeder-nya dulu supaya akunnya benar-benar ada di database.
- Semua akun guru memakai password awal yang sama. Minta setiap guru mengganti password-nya setelah login pertama lewat menu ganti kata sandi.
- Akun yang dibuat manual lewat menu Manajemen User tidak tercatat di file ini.

## Akun Admin

| Nama | Username | Password | Peran |
| --- | --- | --- | --- |
| Administrator | admin | admin123 | admin |

## Akun Guru Kelas (Wali Kelas)

Password semua akun guru: **guru123**

| Nama | Username | Password | Kelas Ampuan | Mata Pelajaran |
| --- | --- | --- | --- | --- |
| Siti Rahmawati | guru.siti | guru123 | 1A | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Dewi Anggraini | guru.dewi | guru123 | 1B | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Agus Setiawan | guru.agus | guru123 | 2A | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Rina Puspita | guru.rina | guru123 | 2B | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Bambang Nugroho | guru.bambang | guru123 | 3A | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Maya Kartika | guru.maya | guru123 | 3B | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Joko Prasetyo | guru.joko | guru123 | 4A | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Fitri Handayani | guru.fitri | guru123 | 4B | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Andi Kurniawan | guru.andi | guru123 | 5A | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Sri Wahyuni | guru.sri | guru123 | 5B | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Dedi Firmansyah | guru.dedi | guru123 | 6A | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |
| Lilis Salim | guru.lilis | guru123 | 6B | Pendidikan Agama, Pendidikan Pancasila, Bahasa Indonesia, Matematika, IPAS, Bahasa Daerah |

## Akun Guru Mata Pelajaran Khusus

Password semua akun guru: **guru123**

| Nama | Username | Password | Mata Pelajaran | Kelas |
| --- | --- | --- | --- | --- |
| Budi Santoso | guru.budi | guru123 | PJOK | Semua kelas (1A sampai 6B) |
| Ani Kusuma | guru.ani | guru123 | Bahasa Inggris | 3A, 3B, 4A, 4B, 5A, 5B, 6A, 6B |
| Tuti Melati | guru.tuti | guru123 | Seni Budaya | Semua kelas (1A sampai 6B) |

## Penugasan Wali Kelas

Setiap guru kelas di atas juga adalah **wali kelas** untuk kelasnya sendiri (akun yang sama, bukan akun terpisah):
guru.siti wali kelas 1A, guru.dewi 1B, guru.agus 2A, guru.rina 2B, guru.bambang 3A, guru.maya 3B,
guru.joko 4A, guru.fitri 4B, guru.andi 5A, guru.sri 5B, guru.dedi 6A, guru.lilis 6B.
Guru spesialis (guru.budi, guru.ani, guru.tuti) tidak menjadi wali kelas.
Sebagai wali kelas, mereka mendapat tab **Keputusan Naik Kelas** di Ruang Kerja Guru untuk memutuskan
naik/tinggal kelas per siswa. Penugasan ini terisi otomatis saat GuruUsersSeeder dijalankan ulang,
dan bisa diubah admin lewat Jadwal & Penugasan, tab Penugasan Wali Kelas.
