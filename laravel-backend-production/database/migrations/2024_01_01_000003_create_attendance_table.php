<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->string('nis');
            $table->string('student_name');
            $table->string('class_name');
            $table->date('date');
            $table->time('time');
            $table->time('time_out')->nullable();
            $table->string('check_out_by')->nullable();
            $table->string('status');
            $table->string('recorded_by');
            $table->timestamp('created_at')->nullable();
            
            $table->index('student_id');
            $table->index('date');
            $table->index('class_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};
