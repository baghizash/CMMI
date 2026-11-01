import React, { useState, useEffect } from 'react';
import { CalendarRange, ArrowRightCircle, X } from 'lucide-react';
import * as api from '../services/api';
import { confirmDialog } from './ConfirmDialog';
import PiketTodayPanel from './PiketTodayPanel';

// Kartu semester aktif di Dashboard. Untuk admin tampil lengkap dengan
// kemajuan keputusan naik kelas dan tombol Semester Baru (dua mode:
// ganti semester saja, atau tutup tahun ajaran yang menjalankan
// keputusan wali kelas). Peran lain hanya melihat semester aktif.
export default function SemesterCard({ notify, user }) {
  const [active, setActive] = useState(null);
  const [status, setStatus] = useState(null); // null = bukan admin / tidak bisa diakses
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: 'Genap', academic_year: '', start_date: '', end_date: '', mode: 'semester' });

  const fetchData = async () => {
    try {
      const res = await api.getActiveSemester();
      setActive(res.data.data || null);
    } catch (e) {
      console.error('Failed fetching active semester', e);
    }
    try {
      const sRes = await api.getPromotionStatus();
      setStatus(sRes.data || null);
    } catch (e) {
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    if (!active) return;
    const [y1] = active.academic_year.split('/').map(Number);
    if (active.name === 'Ganjil') {
      setForm({
        name: 'Genap',
        academic_year: active.academic_year,
        start_date: `${y1 + 1}-01-01`,
        end_date: `${y1 + 1}-06-30`,
        mode: 'semester',
      });
    } else {
      setForm({
        name: 'Ganjil',
        academic_year: `${y1 + 1}/${y1 + 2}`,
        start_date: `${y1 + 1}-07-01`,
        end_date: `${y1 + 1}-12-31`,
        mode: 'tahun',
      });
    }
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.mode === 'tahun') {
      const ok = await confirmDialog({
        message: 'Tutup tahun ajaran sekarang? Keputusan wali kelas akan dijalankan: siswa yang naik berpindah kelas, kelas 6 yang lulus menjadi alumni, yang tinggal tetap di kelasnya. Ini tidak bisa dibatalkan dari aplikasi.',
        confirmText: 'Ya, Tutup Tahun Ajaran',
        danger: true,
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const res = await api.rolloverSemester(form);
      notify && notify('success', res.data.message || 'Semester baru dimulai.');
      setShowModal(false);
      fetchData();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal memulai semester baru.');
    } finally {
      setSaving(false);
    }
  };

  if (!active) return null;

  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm grid lg:grid-cols-2 overflow-hidden">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-plum/10 text-plum flex items-center justify-center shrink-0">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Semester Aktif</p>
            <p className="text-base font-extrabold text-slate-900">
              {active.name} {active.academic_year}
              <span className="text-slate-400 font-bold text-xs"> · {fmtDate(active.start_date)} sampai {fmtDate(active.end_date)}</span>
            </p>
            {status && (
              <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                Keputusan naik kelas: {status.total_decided} dari {status.total_students} siswa
                {status.all_decided ? ' · semua sudah diputuskan' : ' · belum lengkap'}
              </p>
            )}
          </div>
        </div>
        {status && (
          <button
            type="button"
            onClick={openModal}
            className="h-11 px-5 rounded-full bg-marine text-white text-xs font-extrabold shadow-tactile hover:bg-marine-deep active:shadow-tactile-pressed transition-all inline-flex items-center gap-2"
          >
            <ArrowRightCircle className="w-4 h-4" /> Semester Baru
          </button>
        )}
        </div>
        <div className="p-5 border-t lg:border-t-0 lg:border-l border-slate-100">
          <PiketTodayPanel user={user} notify={notify} />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-backdrop-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-pop-in">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Tutup"
              className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Mulai Semester Baru</h3>
            <p className="text-[11px] font-semibold text-slate-500 mb-4">
              Semester berjalan sekarang: {active.name} {active.academic_year}.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, mode: 'semester' })}
                  className={`px-3 py-3 rounded-2xl border text-left transition-all ${form.mode === 'semester' ? 'border-marine bg-marine/5' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="block text-xs font-extrabold text-slate-900">Ganti Semester Saja</span>
                  <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">Tengah tahun ajaran. Tidak ada siswa yang berpindah kelas.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, mode: 'tahun' })}
                  className={`px-3 py-3 rounded-2xl border text-left transition-all ${form.mode === 'tahun' ? 'border-marine bg-marine/5' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <span className="block text-xs font-extrabold text-slate-900">Tutup Tahun Ajaran</span>
                  <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">Jalankan keputusan wali kelas: naik, lulus, tinggal.</span>
                </button>
              </div>

              {form.mode === 'tahun' && status && !status.all_decided && (
                <p className="text-[11px] font-bold text-alpa bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
                  Masih ada {status.total_students - status.total_decided} siswa yang belum diputuskan wali kelasnya. Mode tutup tahun akan ditolak server sampai semua siswa diputuskan.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">Semester</span>
                  <select
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </label>
                <label>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">Tahun Ajaran</span>
                  <input
                    type="text"
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    placeholder="2026/2027"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </label>
                <label>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">Tanggal Mulai</span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </label>
                <label>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">Tanggal Selesai</span>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-marine hover:bg-marine-deep text-white font-extrabold text-xs rounded-full transition-all disabled:opacity-50"
                >
                  {saving ? 'Memproses...' : 'Mulai Semester Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
