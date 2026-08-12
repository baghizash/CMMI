# CMMI System - Windows Setup

## Quick Start

### First Time Setup (Run Once)
```
Double-click: first-time-setup.bat
```
This will:
- Install Composer dependencies (backend)
- Install npm dependencies (frontend)
- Migrate database
- Seed demo data

### Run Application
Open **2 separate terminals**:

**Terminal 1 - Backend:**
```
Double-click: start-backend.bat
```

**Terminal 2 - Frontend:**
```
Double-click: start-frontend.bat
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Demo Login
- Username: **admin**
- Password: **admin123**

---

## Project Structure

```
CMMI-main/
├── laravel-backend-production/   ← Laravel 13 API (PHP)
├── frontend/                      ← React 19 UI
├── first-time-setup.bat           ← Initial setup
├── start-backend.bat              ← Start backend
├── start-frontend.bat             ← Start frontend
├── START-HERE.txt                 ← Quick guide
├── README.md                      ← This file
├── .env                           ← Root config
└── .gitignore                     ← Git ignore rules
```

---

## System Requirements

- Windows 10/11
- Laragon (Apache, PHP 8.3, MySQL)
- Database: MySQL (cmmi_db)

---

## Troubleshooting

**Database not found?**
- Create database "cmmi_db" in MySQL

**Port already in use?**
- Edit batch file to use different port

**npm/php not found?**
- Laragon bins are auto-added to PATH in batch files

---

## Important Files

| File | Purpose |
|------|---------|
| `laravel-backend-production/.env` | Backend database config |
| `frontend/.env` | Frontend API URL |
| `first-time-setup.bat` | One-time initialization |
| `START-HERE.txt` | Quick reference |

