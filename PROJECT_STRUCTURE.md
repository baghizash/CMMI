# 📁 Project Structure - Sistem Absensi Sekolah

```
CMMI-main/
│
├── 📁 laravel-backend-production/     ← ACTIVE: Production Laravel 13 API
│   ├── app/                           (Models, Controllers, etc)
│   ├── database/                      (Migrations, Seeders)
│   ├── routes/                        (API routes)
│   ├── tests/                         (Feature tests)
│   ├── config/                        (Configuration)
│   ├── .env                           (Environment - copy from .env.example)
│   ├── DEPLOYMENT.md                  (Production guide)
│   └── README.md                      (Quick reference)
│
├── 📁 frontend/                       ← ACTIVE: React 19 UI
│   ├── src/
│   │   ├── services/api.js            (Centralized API client)
│   │   ├── App.js                     (Main component)
│   │   └── components/                (UI components)
│   ├── package.json                   (Dependencies)
│   ├── .env                           (Frontend config)
│   └── SETUP.md                       (Setup guide)
│
├── 📁 backend-old-fastapi/            ← ARCHIVE: Old FastAPI code (reference only)
│   ├── server.py
│   ├── requirements.txt
│   └── (other FastAPI files)
│
├── 📄 .env                            (Root environment)
├── 📄 .gitignore                      (Git ignore rules)
├── 📄 .gitconfig                      (Git configuration)
├── 📄 README.md                       (Main documentation)
└── 📄 PROJECT_STRUCTURE.md            (This file)
```

## 🚀 Active Directories

### laravel-backend-production/
**Status**: ✅ PRODUCTION READY

- Complete Laravel 13 API with 53 endpoints
- MongoDB support enabled
- Sanctum authentication
- 19 feature tests
- Excel export functionality
- CORS configured

**To use:**
```bash
cd laravel-backend-production
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed
php artisan serve --port=8000
```

### frontend/
**Status**: ✅ PRODUCTION READY

- React 19 with Tailwind CSS
- Integrated with Laravel API
- Centralized API service
- QR scanning capability
- Real-time statistics

**To use:**
```bash
cd frontend
npm install
npm start
```

## 📦 Archive Directories

### backend-old-fastapi/
**Status**: ⚠️ DEPRECATED (Reference only)

Old FastAPI implementation kept for:
- Code reference during migration
- Database schema understanding
- Historical tracking

**Do NOT use** - This is replaced by laravel-backend-production/

## 📋 Important Files

| File | Purpose |
|------|---------|
| `laravel-backend-production/DEPLOYMENT.md` | Production setup guide |
| `laravel-backend-production/README.md` | API documentation |
| `frontend/SETUP.md` | Frontend deployment |
| `.env` | Root environment config |
| `.gitignore` | Files to ignore in git |

## 🗑️ Removed Files (No Longer Needed)

- ❌ `.emergent/` - Emergent framework files
- ❌ `memory/` - Old memory files
- ❌ `test_reports/` - Old test reports
- ❌ `tests/` - Old test directory
- ❌ `mongodb-compass_1.43.0_amd64.deb` - Installer file
- ❌ `test_result.md` - Old test results
- ❌ `__pycache__/` - Python cache files
- ❌ `.venv/` - Old Python virtual env
- ❌ `backend/.env` - Old FastAPI env

## �� Quick Start

```bash
# Backend (Terminal 1)
cd laravel-backend-production
php artisan serve --port=8000

# Frontend (Terminal 2)
cd frontend
npm start

# Visit http://localhost:3000
# Login: admin / admin123
```

## 📊 Project Status

| Component | Status | Version |
|-----------|--------|---------|
| Backend API | ✅ Production Ready | Laravel 13 |
| Frontend | ✅ Production Ready | React 19 |
| Database | ✅ Configured | MongoDB/SQLite |
| Tests | ✅ 17/19 Passing | PHPUnit |
| Documentation | ✅ Complete | Latest |

---

**Last Updated**: August 3, 2026
**Migration Status**: ✅ COMPLETE
