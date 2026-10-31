<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Peran guru_piket DIHAPUS sebagai peran akun: piket sekarang
     * adalah penugasan harian untuk guru biasa (tabel guru_piket).
     * Akun yang dulu berperan guru_piket menjadi guru biasa; akses
     * absen masuk/pulang mereka mengikuti jadwal piket hariannya.
     */
    public function up(): void
    {
        DB::table('users')->where('role', 'guru_piket')->update(['role' => 'guru']);
    }

    public function down(): void
    {
        // Tidak dapat dikembalikan: tidak tercatat akun mana saja
        // yang sebelumnya berperan guru_piket.
    }
};
