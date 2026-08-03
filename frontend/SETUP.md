# Frontend Setup Guide - Sistem Absensi Sekolah

React 19 frontend untuk sistem absensi sekolah dengan QR scanning capability.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm 8+ or yarn

### Setup (2 minutes)

```bash
cd frontend
npm install
npm start
```

Application akan terbuka di **http://localhost:3000**

## 📝 Environment Configuration

### .env File
```env
REACT_APP_BACKEND_URL=http://localhost:8000
DISABLE_ESLINT_PLUGIN=true
```

### Production .env
```env
REACT_APP_BACKEND_URL=https://api.example.com
DISABLE_ESLINT_PLUGIN=true
```

## 🔐 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Teacher | `guru` | `guru123` |
| Principal | `kepsek` | `kepsek123` |

## 🎯 Features

### Dashboard
- Real-time attendance statistics
- Guru piket information
- Quick action buttons
- Date-based filtering

### QR Scanner
- **Entry Mode** (Masuk): Record arrival
- **Exit Mode** (Pulang): Record departure
- **Subject Mode** (Mapel): Per-subject attendance
- Manual code input fallback
- Real-time feedback

### Student Management
- Add/edit/delete students
- Generate unique QR codes
- Upload student photos
- Bulk seed demo data

### Attendance Tracking
- Scan-based attendance
- Manual status entry
- Late detection (after 07:15)
- Filter by class, date, status

### Schedules
- Class timetable management
- Subject assignments
- Teacher information
- Room assignment

### Reports
- Excel export with formatting
- Filter by date, class, status
- Summary statistics
- Print-friendly layout

## 🔑 API Integration

Frontend uses centralized API service (`src/services/api.js`) with:
- **Automatic Bearer token injection**
- **Error handling and formatting**
- **Request/response interceptors**
- **Centralized base URL configuration**

### Key API Methods

```javascript
import * as api from './services/api';

// Authentication
await api.login(username, password);
await api.logout();
await api.getMe();

// Students
await api.getStudents(params);
await api.createStudent(data);
await api.updateStudent(id, data);
await api.deleteStudent(id);
await api.seedDemo();

// Attendance
await api.scanAttendance(data);
await api.getAttendance(params);
await api.manualAttendance(data);
await api.deleteAttendance(id);

// Reports
api.getExcelExport(params);  // Returns download URL
```

## 🏗️ Build & Deploy

### Development Build
```bash
npm start
```

### Production Build
```bash
npm run build
```

Creates optimized build in `build/` directory (~2.5MB gzipped)

### Deploy to Web Server

#### Using Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Using Nginx
```bash
# Build
npm run build

# Deploy
sudo cp -r build /var/www/cmmi-frontend
sudo chown -R www-data:www-data /var/www/cmmi-frontend

# Configure Nginx (see DEPLOYMENT.md in backend)
```

#### Using Node Server (Simple)
```bash
npm install -g serve
serve -s build -l 3000
```

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 UI Components

Built with Radix UI + Tailwind CSS:

```
components/ui/
├── alert.jsx
├── badge.jsx
├── button.jsx
├── card.jsx
├── checkbox.jsx
├── dialog.jsx
├── dropdown-menu.jsx
├── form.jsx
├── input.jsx
├── label.jsx
├── popover.jsx
├── select.jsx
├── table.jsx
├── tabs.jsx
└── toast.jsx
```

## 🔍 QR Code Features

### Scanning
- Uses `html5-qrcode` library
- Accesses device camera
- Real-time decoding
- Fallback to manual input

### Generation
- Uses `qrcode.react` library
- Generates unique QR per student
- Format: `SCH-QR-{NIS}-{NAME}`
- Downloadable as PNG

## 🚨 Error Handling

Frontend automatically handles:
- ✅ Network errors (connection timeout)
- ✅ Authentication errors (401 Unauthorized)
- ✅ Validation errors (422 Unprocessable Entity)
- ✅ Server errors (5xx responses)
- ✅ CORS issues

All errors display user-friendly notifications.

## 📊 State Management

Uses React hooks:
- `useState` - Local component state
- `useEffect` - Data fetching on mount
- `useRef` - QR scanner reference
- `useCallback` - Memoized callbacks

For complex state, consider adding Redux or Zustand.

## 🔄 API Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

Errors:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { /* validation errors */ }
}
```

## 🎯 Common Tasks

### Change Backend URL
Edit `src/services/api.js` or set `REACT_APP_BACKEND_URL` in .env

### Add New API Endpoint
1. Add method in `src/services/api.js`
2. Import in `App.js`
3. Use in component

### Customize UI
Edit Tailwind classes in JSX or modify `tailwind.config.js`

### Add New Feature
1. Create page component in components/
2. Add route in App.js navigation
3. Add API service method
4. Integrate with backend endpoint

## 🐛 Troubleshooting

### CORS Errors
- Check `REACT_APP_BACKEND_URL`
- Verify backend `CORS_ORIGINS` in .env
- Clear browser cache

### QR Scanner Not Working
- Allow camera permissions
- Check browser support
- Use fallback manual input

### API Calls Failing
- Verify backend is running (`http://localhost:8000`)
- Check network tab in DevTools
- Verify token is being sent

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Resources

- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Radix UI: https://radix-ui.com
- html5-qrcode: https://github.com/mebjas/html5-qrcode

---

**React Version**: 19.0.0  
**Node Requirements**: 16+  
**Last Updated**: August 2026
