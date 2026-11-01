<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Alur status nilai per batch (kelas + mapel + semester):
        // draft -> submitted -> verified -> locked, dan unlock kembali
        // ke draft. Status disimpan per baris nilai; seluruh baris dalam
        // satu batch selalu bergerak bersama, ditegakkan di
        // SubjectGradeController.
        Schema::table('subject_grades', function (Blueprint $table) {
            $table->string('status')->default('draft')->index()->after('final_total');
            $table->timestamp('submitted_at')->nullable()->after('status');
            $table->timestamp('verified_at')->nullable()->after('submitted_at');
            $table->timestamp('locked_at')->nullable()->after('verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('subject_grades', function (Blueprint $table) {
            $table->dropColumn(['status', 'submitted_at', 'verified_at', 'locked_at']);
        });
    }
};
