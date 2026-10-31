import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import NotificationToast from './components/NotificationToast';
import { ConfirmDialogHost } from './components/ConfirmDialog';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScannerPage from './pages/ScannerPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import StudentTranscriptPage from './pages/StudentTranscriptPage';
import TeacherWorkspacePage from './pages/TeacherWorkspacePage';
import RecapPage from './pages/RecapPage';
import SchedulePage from './pages/SchedulePage';
import UsersPage from './pages/UsersPage';
import GradesPage from './pages/GradesPage';

function AppContent() {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('school_user');
    return s ? JSON.parse(s) : null;
  });

  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    notify('success', `Selamat datang, ${userData.name || userData.username}!`);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('school_user');
    setUser(null);
    notify('success', 'Berhasil logout.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {user && (
        <Navbar user={user} onLogout={handleLogout} notify={notify} />
      )}

      <main className={user ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6' : ''}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/dashboard"
            element={user ? <DashboardPage notify={notify} user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/scanner"
            element={user ? <ScannerPage user={user} notify={notify} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/students"
            element={
              user ? (
                user.role === 'guru' ? (
                  <TeacherWorkspacePage user={user} notify={notify} />
                ) : (
                  <StudentsPage notify={notify} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/students/:id"
            element={user ? <StudentDetailPage user={user} notify={notify} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/students/:id/nilai"
            element={user ? <StudentTranscriptPage notify={notify} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/grades"
            element={
              user ? (
                user.role === 'admin' ? (
                  <Navigate to="/schedule" replace />
                ) : user.role === 'guru' ? (
                  <Navigate to="/students?tab=nilai" replace />
                ) : (
                  <GradesPage user={user} notify={notify} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
<Route
            path="/penugasan-guru"
            element={<Navigate to="/schedule" replace />}
          />
          <Route
            path="/recap"
            element={user ? <RecapPage user={user} notify={notify} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/schedule"
            element={user ? <SchedulePage user={user} notify={notify} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/users"
            element={
              user ? (
                user.role === 'admin' ? (
                  <UsersPage user={user} notify={notify} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>

      <NotificationToast notification={notification} />
      <ConfirmDialogHost />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
