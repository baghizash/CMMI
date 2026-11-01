<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Foto profil pengguna (guru, admin, kepsek) untuk avatar di
     * header dan halaman Profil. Disimpan sebagai data URI gambar
     * kecil (diperkecil di sisi klien sebelum dikirim).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->longText('photo')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('photo');
        });
    }
};
