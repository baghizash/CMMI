<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Biodata lengkap siswa untuk halaman detail siswa.
     * Semua kolom nullable: data lama tetap sah, admin melengkapi
     * biodata secara bertahap lewat halaman detail.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('nisn')->nullable();
            $table->string('nik')->nullable();
            $table->string('no_kk')->nullable();
            $table->string('birth_place')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('religion')->nullable();
            $table->text('address')->nullable();
            $table->unsignedTinyInteger('child_order')->nullable();
            $table->unsignedTinyInteger('siblings_count')->nullable();
            $table->string('father_name')->nullable();
            $table->string('father_job')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_job')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('parent_phone')->nullable();
            $table->string('previous_school')->nullable();
            $table->string('enrollment_year')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'nisn', 'nik', 'no_kk', 'birth_place', 'birth_date', 'religion',
                'address', 'child_order', 'siblings_count', 'father_name',
                'father_job', 'mother_name', 'mother_job', 'guardian_name',
                'parent_phone', 'previous_school', 'enrollment_year',
            ]);
        });
    }
};
