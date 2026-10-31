import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  QrCode, LogOut, GraduationCap, Clock, Calendar, KeyRound, UserCog, LayoutDashboard, BookOpen
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar({ user, onLogout, notify }) {
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Absen QR', path: '/scanner', icon: <QrCode className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Data Siswa', path: '/students', icon: <GraduationCap className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Nilai Siswa', path: '/grades', icon: <BookOpen className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Rekap Absensi', path: '/recap', icon: <Clock className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Jadwal & Piket', path: '/schedule', icon: <Calendar className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Manajemen User', path: '/users', icon: <UserCog className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> });
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl backdrop-saturate-150 border-b border-[rgba(30,39,50,0.08)] sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo: a real link, keyboard-operable (audit fix) */}
            <Link
              to="/dashboard"
              aria-label="CMMI Absensi, ke Dashboard"
              className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine focus-visible:ring-offset-2"
            >
              <div className="w-11 h-11 grid place-items-center bg-marine rounded-[13px] text-white shadow-tactile">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-ink text-lg leading-tight tracking-tight">CMMI Absensi</h1>
                <p className="text-[11px] font-semibold text-ink-soft tracking-wider uppercase">Sistem Presensi Sekolah</p>
              </div>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-[#EFEAE0]/90 p-1 rounded-full border border-[rgba(30,39,50,0.05)]" aria-label="Menu utama">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={`group flex items-center gap-2 px-4 h-11 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-marine text-white shadow-tactile font-bold'
                      : 'text-ink-soft hover:text-ink hover:bg-white/80'
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
                  <span className="text-[13px] font-bold text-ink">{user.name || user.username}</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-marine-tint text-marine-deep uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={() => setShowPasswordModal(true)}
                  title="Ganti Password"
                  aria-label="Ganti Password"
                  className="h-11 w-11 grid place-items-center text-ink-soft hover:text-marine hover:bg-marine-tint rounded-full transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine"
                >
                  <KeyRound className="w-[18px] h-[18px]" />
                </button>

                <button
                  onClick={onLogout}
                  title="Logout"
                  aria-label="Logout"
                  className="h-11 w-11 grid place-items-center text-ink-soft hover:text-alpa hover:bg-alpa-tint rounded-full transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-[rgba(30,39,50,0.06)] gap-1.5 no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={`group flex items-center gap-1.5 whitespace-nowrap px-3.5 min-h-[44px] rounded-full text-xs font-semibold transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-marine text-white shadow-tactile'
                  : 'text-ink-soft hover:bg-[#EFEAE0]'
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
