<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('guru_piket', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date');
            $table->string('teacher_name');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable();
            
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guru_piket');
    }
};
