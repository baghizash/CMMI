import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  QrCode, Users, LogOut, Shield, GraduationCap, Clock, Calendar, KeyRound, UserCog, Sun, BookOpen
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar({ user, onLogout, notify }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Sun className="w-4 h-4" /> },
    { label: 'Absen QR', path: '/scanner', icon: <QrCode className="w-4 h-4" /> },
    { label: 'Data Siswa', path: '/students', icon: <GraduationCap className="w-4 h-4" /> },
    { label: 'Nilai Siswa', path: '/grades', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Rekap Absensi', path: '/recap', icon: <Clock className="w-4 h-4" /> },
    { label: 'Jadwal & Piket', path: '/schedule', icon: <Calendar className="w-4 h-4" /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Manajemen User', path: '/users', icon: <UserCog className="w-4 h-4" /> });
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">CMMI Absensi</h1>
                <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Sistem Presensi Sekolah</p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive(item.path)
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Profile Controls */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-800">{user.name || user.username}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={() => setShowPasswordModal(true)}
                  title="Ganti Password"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-100 gap-1 no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        notify={notify}
      />
    </>
  );
}
