<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance', 'notes')) {
                $table->string('notes')->nullable()->after('status');
            }
            if (!Schema::hasColumn('attendance', 'leave_type')) {
                $table->string('leave_type')->nullable()->after('notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn(['notes', 'leave_type']);
        });
    }
};
