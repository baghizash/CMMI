import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  QrCode, LogOut, GraduationCap, Clock, Calendar, KeyRound, UserCog, LayoutDashboard, BookOpen, UserCheck, UserRound, Sun, Moon
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import useSlidingIndicator from '../hooks/useSlidingIndicator';

// Satu baris tautan navigasi dengan pil marine yang MELUNCUR ke
// tautan aktif (bukan muncul/hilang sekejap). Dipakai dua kali:
// baris desktop di dalam header dan baris mobile di bawahnya.
function NavRow({ items, isActive, variant }) {
  const activeItem = items.find((i) => isActive(i.path));
  const { containerRef, registerItem, box } = useSlidingIndicator(
    activeItem?.path,
    items.map((i) => i.path).join(',')
  );
  const isDesktop = variant === 'desktop';
  return (
    <nav
      ref={containerRef}
      className={
        isDesktop
          ? 'relative hidden md:flex flex-nowrap items-center gap-1 bg-[#EFEAE0]/90 p-1 rounded-full border border-[rgba(30,39,50,0.05)] overflow-x-auto no-scrollbar min-w-0'
          : 'relative md:hidden flex overflow-x-auto px-4 py-2 border-t border-[rgba(30,39,50,0.06)] gap-1.5 no-scrollbar'
      }
      aria-label="Menu utama"
    >
      {box && (
        <span
          aria-hidden="true"
          className="sliding-indicator rounded-full bg-marine"
          style={{ transform: `translateX(${box.x}px)`, width: box.w, top: isDesktop ? 4 : 8, bottom: isDesktop ? 4 : 8 }}
        />
      )}
      {items.map((item) => (
        <Link
          key={item.path}
          ref={registerItem(item.path)}
          to={item.path}
          aria-current={isActive(item.path) ? 'page' : undefined}
          className={`group relative z-10 flex items-center gap-2 shrink-0 whitespace-nowrap rounded-full text-xs font-semibold transition-colors duration-200 active:scale-[0.97] ${
            isDesktop ? 'px-3 h-11' : 'px-3.5 min-h-[44px] gap-1.5'
          } ${
            isActive(item.path)
              ? 'text-white font-bold'
              : 'text-ink-soft hover:text-ink'
          }`}
          style={{ transitionDelay: isActive(item.path) ? '60ms' : '0ms' }}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function Navbar({ user, onLogout, notify, theme, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileMenuOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [profileMenuOpen]);

  const initials = (user?.name || user?.username || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Absen QR', path: '/scanner', icon: <QrCode className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Data Siswa', path: '/students', icon: <GraduationCap className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    ...(user?.role === 'admin' || user?.role === 'guru'
      ? []
      : [{ label: 'Nilai Siswa', path: '/grades', icon: <BookOpen className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> }]),
    { label: 'Rekap Absensi', path: '/recap', icon: <Clock className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
    { label: 'Jadwal & Penugasan', path: '/schedule', icon: <Calendar className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ label: 'Manajemen User', path: '/users', icon: <UserCog className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6" /> });
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl backdrop-saturate-150 border-b border-[rgba(30,39,50,0.08)] sticky top-0 z-40 print:hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-[68px]">
            {/* Logo: a real link, keyboard-operable (audit fix) */}
            <Link
              to="/dashboard"
              aria-label="CMMI Absensi, ke Dashboard"
              className="flex items-center gap-3 shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine focus-visible:ring-offset-2"
            >
              <div className="w-11 h-11 grid place-items-center bg-marine rounded-[13px] text-white shadow-tactile">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-ink text-lg leading-tight tracking-tight">CMMI Absensi</h1>
                <p className="hidden min-[1500px]:block text-[11px] font-semibold text-ink-soft tracking-wider uppercase">Sistem Presensi Sekolah</p>
              </div>
            </Link>

            <NavRow items={navItems} isActive={isActive} variant="desktop" />

            {/* User Profile Controls */}
            {user && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={onToggleTheme}
                  title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                  aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
                  className="h-11 w-11 grid place-items-center text-ink-soft hover:text-marine hover:bg-marine-tint rounded-full transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine"
                >
                  {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </button>

                <button
                  onClick={() => setShowPasswordModal(true)}
                  title="Ganti Password"
                  aria-label="Ganti Password"
                  className="h-11 w-11 grid place-items-center text-ink-soft hover:text-marine hover:bg-marine-tint rounded-full transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine"
                >
                  <KeyRound className="w-[18px] h-[18px]" />
                </button>

                {/* Profil: foto + nama di bawahnya; ditekan membuka menu Profil & Logout */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    title={user.name || user.username}
                    className="flex flex-col items-center gap-1 px-1 py-1 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine"
                  >
                    {user.photo ? (
                      <img src={user.photo} alt="" className="w-9 h-9 rounded-full object-cover border border-[#E7E0D0] shadow-soft" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-marine text-white grid place-items-center text-[11px] font-extrabold shadow-soft">{initials}</span>
                    )}
                    <span className="text-[10px] font-bold text-ink leading-none max-w-[110px] truncate">{user.name || user.username}</span>
                  </button>

                  {profileMenuOpen && (
                    <div role="menu" className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-1.5 z-50 animate-pop-in">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-extrabold text-ink truncate">{user.name || user.username}</p>
                        <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">{user.role}</p>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-ink hover:bg-marine-tint transition-colors"
                      >
                        <UserRound className="w-4 h-4 text-marine" /> Profil
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-alpa hover:bg-alpa-tint transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <NavRow items={navItems} isActive={isActive} variant="mobile" />
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        notify={notify}
      />
    </>
  );
}
