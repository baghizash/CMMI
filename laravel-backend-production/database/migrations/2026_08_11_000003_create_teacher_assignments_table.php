<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('teacher_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable();
            $table->string('username')->nullable();
            $table->string('teacher_name');
            $table->string('class_name');
            $table->string('subject_name');
            $table->timestamp('created_at')->nullable();

            $table->index('user_id');
            $table->index('class_name');
            $table->index('subject_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_assignments');
    }
};
