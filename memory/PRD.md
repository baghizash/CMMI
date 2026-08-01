# Sistem Absensi Sekolah - PRD

## Problem Statement
Aplikasi web sistem absensi sekolah dengan dua jenis pengguna (admin & guru). Admin kelola data siswa dengan QR code unik otomatis + laporan kehadiran. Guru scan QR siswa via kamera HP untuk mencatat kehadiran real-time.

## Tech Stack
- Backend: FastAPI + Motor (async MongoDB) + Pydantic v2
- Frontend: React 19 + Tailwind + qrcode.react + html5-qrcode
- Database: MongoDB

## User Personas
- **Admin/Kepala Sekolah**: kelola siswa, cetak QR, lihat laporan lengkap
- **Guru Piket**: scan QR siswa via HP, lihat rekap hari ini

## Core Requirements
1. Data siswa + QR code unik otomatis (per siswa)
2. Halaman scan kamera HP untuk guru → langsung tercatat
3. Rekap kehadiran per siswa/kelas/tanggal

## Implemented (2026-08-01)
- Login admin/guru + demo quick-login
- CRUD siswa dengan QR code otomatis
- Scanner kamera HP (html5-qrcode) + manual NIS input
- Rekap kehadiran multi-filter + ubah status
- Dashboard statistik harian
- Modal cetak kartu QR pelajar
- Seed demo data (12 siswa, 5 kelas)
- **[Fix]** Bug ObjectId serialization pada `/api/attendance/scan` diperbaiki dengan `pop("_id")` setelah insert

## Test Credentials
Admin: admin / admin123
Guru: guru / guru123
Kepsek: kepsek / kepsek123

## Backlog (P0/P1/P2)
- P1: Export Excel/CSV rekap kehadiran
- P1: Cetak QR massal (multi kartu per halaman A4)
- P2: Notifikasi WhatsApp ke orang tua
- P2: Chart tren kehadiran mingguan/bulanan
