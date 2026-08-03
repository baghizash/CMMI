# Sistem Absensi Sekolah - Laravel 13 API

Modern school attendance system built with **Laravel 13**, **Sanctum**, **MongoDB/SQLite**, and **React**.

## 🎯 Features

✅ **QR Code Scanning** - Attendance check-in/out via QR codes  
✅ **Multi-Mode Tracking** - Entry, exit, and subject-specific attendance  
✅ **Real-time Statistics** - Live dashboard with attendance metrics  
✅ **Role-Based Access** - Admin, teacher, principal roles  
✅ **Excel Reports** - Export attendance data with formatting  
✅ **Schedule Management** - Class schedules and duty assignments  
✅ **Demo Data** - 12 sample students auto-generated for testing  
✅ **API-First** - RESTful API with token-based authentication  

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 16+
- MongoDB or SQLite

### Development Setup (5 minutes)

```bash
# Backend setup
cd laravel-backend
composer install
php artisan key:generate
php artisan migrate --force
php artisan db:seed

# Start server (Terminal 1)
php artisan serve --port=8000

# Frontend setup (Terminal 2)
cd ../frontend
npm install
npm start
```

Open http://localhost:3000 and login with demo credentials:
- **Admin**: `admin` / `admin123`
- **Teacher**: `guru` / `guru123`

## 📚 Project Structure

```
cmmi-system/
├── laravel-backend/          # Laravel 13 REST API
│   ├── app/
│   │   ├── Models/          # Database models
│   │   ├── Http/Controllers/Api/
│   │   └── Exports/         # Excel export classes
│   ├── database/
│   │   ├── migrations/      # Schema definitions
│   │   └── seeders/         # Demo data
│   ├── routes/api.php       # API routes
│   ├── tests/Feature/       # Integration tests
│   └── DEPLOYMENT.md        # Production guide
│
└── frontend/                # React 19 UI
    ├── src/
    │   ├── services/api.js  # Centralized API client
    │   ├── App.js          # Main component
    │   └── components/ui/  # UI library
    └── .env               # Frontend config
```

## 🔐 Authentication

Uses **Laravel Sanctum** with Bearer token authentication.

```javascript
// Frontend example
const response = await api.login('admin', 'admin123');
const token = response.data.token;

// All subsequent requests automatically include token via interceptor
```

## 📡 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Core Endpoints

**Authentication**
```
POST   /auth/login              (public)
POST   /auth/logout             (authenticated)
GET    /auth/me                 (authenticated)
```

**Students Management**
```
GET    /students                List all students
POST   /students                Create new student
PUT    /students/{id}           Update student
DELETE /students/{id}           Remove student
POST   /students/seed-demo      Generate 12 demo students
```

**Attendance Tracking**
```
POST   /attendance/scan         Scan QR/NIS (entry/exit)
GET    /attendance              List attendance records
POST   /attendance/manual       Manual entry/edit
DELETE /attendance/{id}         Delete record
```

**Subject Attendance**
```
POST   /subject-attendance/scan  Scan for specific subject
GET    /subject-attendance       List subject attendance
```

**Schedules & Staff**
```
GET    /schedules               List class schedules
POST   /schedules               Create schedule
DELETE /schedules/{id}          Remove schedule

GET    /guru-piket              List duty teachers
POST   /guru-piket              Assign duty teacher
DELETE /guru-piket/{id}         Remove assignment
```

**Dashboard**
```
GET    /dashboard/stats         Get attendance statistics
GET    /export/excel            Download Excel report
```

## 🗄️ Database

### Supported Databases
- **SQLite** - Default for development (zero-setup)
- **MongoDB** - Production-recommended for flexibility

### Collections/Tables
| Name | Purpose |
|------|---------|
| `users` | Admin, teacher, principal accounts |
| `students` | Student records with QR codes |
| `attendance` | Daily entry/exit records |
| `subject_attendance` | Per-subject attendance |
| `schedules` | Class timetables |
| `guru_piket` | Duty teacher assignments |

### Seed Data
```bash
# Generate demo data (12 students, 6 schedules, 1 duty teacher)
php artisan db:seed

# Reset and reseed
php artisan migrate:fresh --seed
```

## 🧪 Testing

```bash
# Run all tests (19 test cases)
php artisan test

# Run specific test file
php artisan test tests/Feature/AuthTest.php

# Run with coverage
php artisan test --coverage
```

Test coverage includes:
- ✅ Authentication (login, logout, token management)
- ✅ Student CRUD operations
- ✅ Attendance scanning and manual entry
- ✅ Dashboard statistics calculation
- ✅ Excel export functionality

## 🌍 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production setup guide including:
- System requirements
- Nginx/Apache configuration
- SSL/HTTPS setup
- MongoDB deployment
- Performance optimization
- Backup & restore procedures

**Quick Deploy:**
```bash
# 1. Update .env
cp .env.example .env
# Edit .env with production values

# 2. Run migrations
php artisan migrate --force

# 3. Optimize for production
php artisan config:cache
php artisan route:cache

# 4. Start with Supervisor/systemd
sudo systemctl start laravel-app
```

## 📊 Attendance Statistics

Dashboard displays:
- **Total Students**: Complete count
- **Hadir** (Present): On-time arrivals
- **Terlambat** (Late): After 07:15
- **Sakit** (Sick): Excused absence
- **Izin** (Permission): Approved absence  
- **Alpa** (Absent): Unexcused absence
- **Sudah Pulang** (Departed): Exit recorded
- **Belum Absen** (Not Yet): No record

## 🎨 Frontend Technology

- **React 19** - UI library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **html5-qrcode** - QR scanning
- **qrcode.react** - QR generation

## 🔧 Configuration

### .env Variables
```env
APP_NAME="Sistem Absensi Sekolah"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# OR for MongoDB:
# DB_CONNECTION=mongodb
# MONGODB_URI=mongodb://localhost:27017
# MONGODB_DATABASE=school_attendance_db

SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8000
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## 📝 License

Private project for CMMI school system.

## 👥 Authors

- **Backend**: Laravel 13 API implementation
- **Frontend**: React UI implementation
- **Migration**: FastAPI → Laravel, MongoDB support

## 📞 Support

For deployment issues, refer to [DEPLOYMENT.md](./DEPLOYMENT.md) or check:
- Laravel Docs: https://laravel.com/docs
- MongoDB Guide: https://docs.mongodb.com
- Issues: GitHub repository

---

**Version**: 2.0 (Laravel 13 Migration)  
**Last Updated**: August 2026
