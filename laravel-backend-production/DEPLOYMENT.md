# Deployment Guide - Sistem Absensi Sekolah Laravel 13

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [MongoDB Setup](#mongodb-setup)
5. [Environment Configuration](#environment-configuration)
6. [API Endpoints](#api-endpoints)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **PHP**: 8.2 or higher
- **Composer**: Latest version
- **Database**: MongoDB 4.4+ OR SQLite 3+
- **Node.js**: 16+ (for frontend React)
- **npm/yarn**: Latest stable

### Recommended for Production
- **Web Server**: Nginx or Apache 2.4+
- **PHP-FPM**: 8.2+
- **MongoDB**: 5.0+
- **Redis**: For caching and queue (optional)

---

## Local Development Setup

### 1. Clone Repository
```bash
cd /home/baghizash/CMMI
git clone <repository-url> CMMI-main
cd CMMI-main/laravel-backend
```

### 2. Install Dependencies
```bash
composer install
php artisan key:generate
```

### 3. Setup Database
For SQLite (default for development):
```bash
php artisan migrate --force
php artisan db:seed
```

For MongoDB:
```bash
# Install MongoDB PHP extension
pecl install mongodb

# Update .env
DB_CONNECTION=mongodb
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=school_attendance_db

# Run migrations
php artisan migrate --force
php artisan db:seed
```

### 4. Start Development Server

**Backend (Terminal 1):**
```bash
cd laravel-backend
php artisan serve --port=8000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### 5. Login Credentials

**Demo Accounts:**
- Admin: `admin` / `admin123`
- Teacher: `guru` / `guru123`
- Principal: `kepsek` / `kepsek123`

---

## Production Deployment

### 1. Server Setup

#### Install System Dependencies (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y php8.2 php8.2-fpm php8.2-cli php8.2-curl php8.2-mbstring \
  php8.2-xml php8.2-zip php8.2-bcmath php8.2-mongodb composer nginx mongodb git npm
```

#### Install MongoDB Extension
```bash
sudo pecl install mongodb
echo "extension=mongodb.so" | sudo tee /etc/php/8.2/mods-available/mongodb.ini
sudo phpenmod mongodb
```

### 2. Clone & Setup Application
```bash
cd /var/www
sudo git clone <repository-url> cmmi-system
cd cmmi-system/laravel-backend

# Setup permissions
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 777 storage bootstrap/cache

# Install dependencies
composer install --optimize-autoloader --no-dev

# Generate app key
php artisan key:generate
```

### 3. Configure Environment (.env)
```bash
cp .env.example .env

# Edit .env for production
nano .env
```

**Production .env settings:**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database - MongoDB
DB_CONNECTION=mongodb
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=school_attendance_db

# Frontend URLs
SANCTUM_STATEFUL_DOMAINS=your-domain.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Cache
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
```

### 4. Database Setup
```bash
php artisan migrate --force
php artisan db:seed
```

### 5. Setup Nginx

Create `/etc/nginx/sites-available/cmmi-system`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/cmmi-system/laravel-backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }

    # For API routes
    location /api/ {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;
    gzip_vary on;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/cmmi-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL Certificate (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

### 7. Start Services
```bash
sudo systemctl start php8.2-fpm
sudo systemctl start nginx
sudo systemctl start mongodb

# Enable on boot
sudo systemctl enable php8.2-fpm nginx mongodb
```

### 8. Deploy React Frontend
```bash
cd /var/www/cmmi-system/frontend

# Build production
npm install
npm run build

# Copy to web server
sudo cp -r build /var/www/cmmi-frontend
sudo chown -R www-data:www-data /var/www/cmmi-frontend
```

### 9. Configure Frontend Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name app.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/cmmi-frontend;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## MongoDB Setup

### Local MongoDB (for development)
```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Create Database and Users
```bash
mongosh

# Create database and collections
use school_attendance_db

# Create admin user
db.createUser({
  user: "admin_user",
  pwd: "secure_password_here",
  roles: ["readWrite"]
})

# Exit
exit
```

### Update MongoDB URI in .env
```env
MONGODB_URI=mongodb://admin_user:secure_password_here@localhost:27017/school_attendance_db
```

### Backup MongoDB
```bash
# Backup
mongodump --db school_attendance_db --out /backup/mongodb/

# Restore
mongorestore --db school_attendance_db /backup/mongodb/school_attendance_db/
```

---

## Environment Configuration

### .env Variables Explanation

| Variable | Purpose | Example |
|----------|---------|---------|
| `APP_ENV` | Environment mode | `production`, `local`, `testing` |
| `APP_DEBUG` | Debug mode | `false` for production |
| `APP_URL` | API base URL | `https://api.example.com` |
| `DB_CONNECTION` | Database driver | `mongodb`, `sqlite` |
| `MONGODB_URI` | MongoDB connection | `mongodb://host:27017` |
| `SANCTUM_STATEFUL_DOMAINS` | Allowed domains | `localhost:3000,app.example.com` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://app.example.com` |
| `LOG_LEVEL` | Logging level | `debug`, `info`, `warning`, `error` |

### Production Checklist
- [ ] `APP_DEBUG` is `false`
- [ ] `APP_ENV` is `production`
- [ ] `APP_KEY` is set (run `php artisan key:generate`)
- [ ] `DB_CONNECTION` configured correctly
- [ ] MongoDB connection tested and working
- [ ] CORS_ORIGINS updated with production domain
- [ ] SSL certificate configured
- [ ] File permissions correct (storage, bootstrap/cache)
- [ ] Backup strategy in place
- [ ] Log rotation configured

---

## API Endpoints

### Authentication
```
POST   /api/auth/login              - Login user
POST   /api/auth/logout             - Logout user
GET    /api/auth/me                 - Get current user
```

### Students
```
GET    /api/students                - List students
POST   /api/students                - Create student
PUT    /api/students/{id}           - Update student
DELETE /api/students/{id}           - Delete student
POST   /api/students/seed-demo      - Seed demo data
```

### Attendance
```
POST   /api/attendance/scan         - Scan attendance (QR/NIS)
GET    /api/attendance              - List attendance records
POST   /api/attendance/manual       - Manual attendance entry
DELETE /api/attendance/{id}         - Delete attendance record
```

### Subject Attendance
```
POST   /api/subject-attendance/scan - Scan subject attendance
GET    /api/subject-attendance      - List subject attendance
```

### Schedules
```
GET    /api/schedules               - List schedules
POST   /api/schedules               - Create schedule
DELETE /api/schedules/{id}          - Delete schedule
```

### Guru Piket (Duty Teacher)
```
GET    /api/guru-piket              - List duty teachers
POST   /api/guru-piket              - Add duty teacher
DELETE /api/guru-piket/{id}         - Delete duty teacher
```

### Dashboard & Reports
```
GET    /api/dashboard/stats         - Get dashboard statistics
GET    /api/export/excel            - Export attendance to Excel
```

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection
mongosh --uri "mongodb://admin_user:password@localhost:27017/school_attendance_db"

# Check MongoDB status
sudo systemctl status mongodb

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Permission Issues
```bash
# Fix storage permissions
sudo chown -R www-data:www-data storage
sudo chmod -R 775 storage bootstrap/cache
```

### 500 Internal Server Error
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Re-optimize
php artisan config:cache
php artisan route:cache
```

### CORS Errors
1. Check `CORS_ORIGINS` in `.env`
2. Verify frontend domain matches
3. Check `SANCTUM_STATEFUL_DOMAINS`
4. Clear browser cache and cookies

### Database Migration Issues
```bash
# Reset migrations (development only)
php artisan migrate:reset
php artisan migrate:fresh --seed

# Run migrations step by step
php artisan migrate --step
```

---

## Performance Optimization

### Caching
```bash
# Enable config caching
php artisan config:cache

# Enable route caching
php artisan route:cache

# Enable view caching
php artisan view:cache
```

### Database Indexing
```bash
# MongoDB indexes are created automatically on collections
# Verify in MongoDB:
db.students.getIndexes()
db.attendance.getIndexes()
```

### Load Balancing (Multi-Server)
For high-traffic production, configure:
- Multiple PHP-FPM instances
- Nginx upstream load balancing
- Centralized MongoDB instance or replica set
- Redis for session management

---

## Support & Documentation

- Laravel Documentation: https://laravel.com/docs/13.x
- MongoDB Documentation: https://docs.mongodb.com
- Sanctum Documentation: https://laravel.com/docs/13.x/sanctum

---

**Last Updated**: August 2026
**Laravel Version**: 13.x
**MongoDB Version**: 5.0+
