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

// Public routes - CSRF exempt
Route::post('/auth/login', [AuthController::class, 'login'])->withoutMiddleware('auth:sanctum');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Students routes
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::put('/students/{id}', [StudentController::class, 'update']);
    Route::delete('/students/{id}', [StudentController::class, 'destroy']);
    Route::post('/students/seed-demo', [StudentController::class, 'seedDemo']);

    // Attendance routes
    Route::post('/attendance/scan', [AttendanceController::class, 'scan']);
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance/manual', [AttendanceController::class, 'manual']);
    Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);

    // Subject Attendance routes
    Route::post('/subject-attendance/scan', [SubjectAttendanceController::class, 'scan']);
    Route::get('/subject-attendance', [SubjectAttendanceController::class, 'index']);

    // Schedules routes
    Route::get('/schedules', [ScheduleController::class, 'index']);
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);

    // Guru Piket routes
    Route::get('/guru-piket', [GuruPiketController::class, 'index']);
    Route::post('/guru-piket', [GuruPiketController::class, 'store']);
    Route::delete('/guru-piket/{id}', [GuruPiketController::class, 'destroy']);

    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Export routes
    Route::get('/export/excel', [ExportController::class, 'excel']);
});
