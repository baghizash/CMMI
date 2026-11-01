<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel semester: tepat satu baris aktif pada satu waktu.
        Schema::create('semesters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // Ganjil / Genap
            $table->string('academic_year'); // 2026/2027
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        // Semester berjalan saat ini: Ganjil 2026/2027.
        $semesterId = (string) Str::uuid();
        DB::table('semesters')->insert([
            'id' => $semesterId,
            'name' => 'Ganjil',
            'academic_year' => '2026/2027',
            'start_date' => '2026-07-01',
            'end_date' => '2026-12-31',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Nilai terhubung ke semester; nilai lama seluruhnya milik
        // semester berjalan (sesuai asal-usulnya selama ini).
        Schema::table('subject_grades', function (Blueprint $table) {
            $table->uuid('semester_id')->nullable()->index()->after('subject_name');
        });
        DB::table('subject_grades')->update(['semester_id' => $semesterId]);

        // Absensi terhubung ke semester; baris lama diisikan menurut
        // rentang tanggal semester berjalan.
        Schema::table('attendance', function (Blueprint $table) {
            $table->uuid('semester_id')->nullable()->index()->after('date');
        });
        DB::table('attendance')
            ->whereBetween('date', ['2026-07-01', '2026-12-31'])
            ->update(['semester_id' => $semesterId]);

        // Penugasan wali kelas: satu wali per kelas, di atas akun guru.
        Schema::create('homeroom_teachers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('username')->nullable();
            $table->string('teacher_name');
            $table->string('class_name')->unique();
            $table->timestamps();
        });

        // Arsip keputusan naik/tinggal kelas per siswa per semester.
        Schema::create('promotion_decisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id')->index();
            $table->uuid('semester_id')->index();
            $table->string('class_name'); // potret kelas saat diputuskan
            $table->string('decision'); // naik / tinggal / lulus
            $table->unsignedBigInteger('decided_by')->nullable();
            $table->string('decided_by_name')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();
            $table->unique(['student_id', 'semester_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_decisions');
        Schema::dropIfExists('homeroom_teachers');
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn('semester_id');
        });
        Schema::table('subject_grades', function (Blueprint $table) {
            $table->dropColumn('semester_id');
        });
        Schema::dropIfExists('semesters');
    }
};
