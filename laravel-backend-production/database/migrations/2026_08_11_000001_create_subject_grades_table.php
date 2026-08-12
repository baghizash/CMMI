<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subject_grades', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id')->index();
            $table->string('student_nis')->nullable();
            $table->string('student_name')->nullable();
            $table->string('class_name')->nullable()->index();
            $table->string('subject_name')->index();
            $table->unsignedBigInteger('teacher_id')->nullable()->index();
            $table->decimal('task_score', 5, 2)->nullable();
            $table->decimal('midterm_score', 5, 2)->nullable();
            $table->decimal('remedial_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->decimal('final_total', 5, 2)->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_grades');
    }
};
