<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('day');
            $table->integer('period');
            $table->string('class_name');
            $table->string('subject_name');
            $table->string('teacher_name');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room')->nullable();
            $table->timestamp('created_at')->nullable();
            
            $table->index('day');
            $table->index('class_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
