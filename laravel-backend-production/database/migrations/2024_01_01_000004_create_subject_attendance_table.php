<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subject_attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->string('nis');
            $table->string('student_name');
            $table->string('class_name');
            $table->date('date');
            $table->time('time');
            $table->string('subject_name');
            $table->integer('period');
            $table->string('teacher_name');
            $table->string('status');
            $table->timestamp('created_at')->nullable();
            
            $table->index('student_id');
            $table->index('date');
            $table->index('subject_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_attendance');
    }
};
