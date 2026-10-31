import React, { useState } from 'react';
import { GraduationCap, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import * as api from '../services/api';

// Halaman login mengikuti desain v3 yang terkunci: dasar oat (paper),
// kartu putih taktil, marine sebagai warna brand, kolom isian inset
// lembut, tombol kapsul yang tertekan saat diklik. Kredensial demo
// TIDAK lagi dicetak di halaman ini.
export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password);
      if (response.data.success) {
        const userData = {
          token: response.data.token,
          role: response.data.role,
          name: response.data.name,
          username: username,
        };
        localStorage.setItem('school_user', JSON.stringify(userData));
        onLoginSuccess(userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal login. Periksa username & password.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-11 pr-4 py-3 rounded-2xl bg-paper border border-[#E7E0D0] shadow-[inset_0_2px_5px_rgba(30,39,50,0.07)] text-sm font-semibold text-ink placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-marine/25 focus:border-marine transition-all';

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4 relative overflow-hidden">
      {/* Aksen latar lembut dari palet v3, bukan blob indigo lama */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-marine/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-butter/25 rounded-full blur-3xl" />

      <div className="bg-white border border-[#E7E0D0] rounded-3xl p-8 max-w-md w-full shadow-tile relative z-10 animate-pop-in">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 grid place-items-center bg-marine rounded-[16px] text-white shadow-tactile mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-ink tracking-tight">CMMI Absensi</h2>
          <p className="text-xs font-semibold text-ink-soft mt-1">Sistem Presensi Sekolah — masuk untuk melanjutkan</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-alpa-tint border border-alpa/20 text-alpa text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoComplete="username"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                className="absolute right-3 top-2.5 w-7 h-7 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-marine hover:bg-marine-deep active:shadow-tactile-pressed text-white font-extrabold text-sm rounded-full transition-all shadow-tactile flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : <>Masuk Aplikasi <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="mt-8 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400 font-semibold">
          Gunakan akun yang diberikan sekolah Anda.
        </p>
      </div>
    </div>
  );
}
