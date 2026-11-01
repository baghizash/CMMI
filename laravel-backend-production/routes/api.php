<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\SubjectAttendanceController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\GuruPiketController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExportController;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TeacherAssignmentController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\HomeroomTeacherController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Middleware\CheckRole;

// Public routes - CSRF exempt
Route::post('/auth/login', [AuthController::class, 'login'])->withoutMiddleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // User management routes (Admin only)
    Route::middleware(CheckRole::class . ':admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Teacher assignments management
        Route::get('/teacher-assignments', [TeacherAssignmentController::class, 'index']);
        Route::post('/teacher-assignments', [TeacherAssignmentController::class, 'store']);
        Route::delete('/teacher-assignments/{id}', [TeacherAssignmentController::class, 'destroy']);

        // Homeroom (wali kelas) assignments management
        Route::get('/homeroom-teachers', [HomeroomTeacherController::class, 'index']);
        Route::post('/homeroom-teachers', [HomeroomTeacherController::class, 'store']);
        Route::delete('/homeroom-teachers/{id}', [HomeroomTeacherController::class, 'destroy']);

        // Semester rollover (tombol Semester Baru) + kemajuan keputusan
        Route::post('/semesters/rollover', [SemesterController::class, 'rollover']);
        Route::get('/promotions/status', [PromotionController::class, 'status']);
    });

    // Semesters (semua peran boleh membaca)
    Route::get('/semesters', [SemesterController::class, 'index']);
    Route::get('/semesters/active', [SemesterController::class, 'active']);

    // Keputusan naik kelas (wali kelas; diperiksa di controller)
    Route::get('/promotions/my-classes', [PromotionController::class, 'myClasses']);
    Route::post('/promotions/decide', [PromotionController::class, 'decide']);

    // Transkrip per semester
    Route::get('/students/{id}/transcript', [StudentController::class, 'transcript']);

    // Teacher scope
    Route::get('/teacher-assignments/my-scope', [TeacherAssignmentController::class, 'myScope']);

    // Students routes — index & store are scoped in controller for guru
    Route::get('/students', [StudentController::class, 'index']);
    Route::get('/students/{id}', [StudentController::class, 'show']);
    Route::post('/students', [StudentController::class, 'store']);

    // Student management routes (Admin & Kepsek only)
    Route::middleware(CheckRole::class . ':admin,kepsek')->group(function () {
        Route::post('/students/import', [StudentController::class, 'import']);
        Route::post('/students/promote-class', [StudentController::class, 'promoteClass']);
        Route::put('/students/{id}', [StudentController::class, 'update']);
        Route::delete('/students/{id}', [StudentController::class, 'destroy']);
    });

    // Daily Attendance routes — Absen Masuk & Pulang. Akses diperiksa
    // di AttendanceController: admin/kepsek selalu boleh; guru hanya
    // bila hari ini ia bertugas piket (peran guru_piket sudah dihapus).
    Route::post('/attendance/scan', [AttendanceController::class, 'scan']);
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance/manual', [AttendanceController::class, 'manual']);
    Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);

    // Subject Attendance routes — Absen Mapel (scoped in controller for guru)
    Route::middleware(CheckRole::class . ':admin,kepsek,guru_piket,guru')->group(function () {
        Route::post('/subject-attendance/scan', [SubjectAttendanceController::class, 'scan']);
        Route::get('/subject-attendance', [SubjectAttendanceController::class, 'index']);
    });

    // Schedules routes: membaca boleh semua peran (jadwal guru
    // ditampilkan terfilter mapel ampuannya di halaman); mengubah
    // hanya Admin & Kepsek.
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::middleware(CheckRole::class . ':admin,kepsek')->group(function () {
        Route::post('/schedules', [ScheduleController::class, 'store']);
        Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);
    });

    // Guru Piket routes: membaca daftar boleh semua peran (tab piket
    // di halaman Jadwal bersifat lihat-saja untuk guru); mengubah
    // data hanya Admin & Kepsek.
    Route::get('/guru-piket', [GuruPiketController::class, 'index']);
    Route::middleware(CheckRole::class . ':admin,kepsek')->group(function () {
        Route::post('/guru-piket', [GuruPiketController::class, 'store']);
        Route::delete('/guru-piket/{id}', [GuruPiketController::class, 'destroy']);
    });

    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Export routes (Admin & Kepsek only)
    Route::middleware(CheckRole::class . ':admin,kepsek')->group(function () {
        Route::get('/export/excel', [ExportController::class, 'excel']);
    });

    // Subject Grades (nilai) routes — scoped in controller for guru
    Route::get('/grades', [\App\Http\Controllers\Api\SubjectGradeController::class, 'index']);
    Route::get('/grades/grouped', [\App\Http\Controllers\Api\SubjectGradeController::class, 'grouped']);
    Route::post('/grades/batch', [\App\Http\Controllers\Api\SubjectGradeController::class, 'batchStore']);
    Route::get('/grades/student/{id}', [\App\Http\Controllers\Api\SubjectGradeController::class, 'studentGrades']);
    Route::post('/grades', [\App\Http\Controllers\Api\SubjectGradeController::class, 'store']);
});
