import React, { useState, useEffect } from 'react';
import { UserCog, X } from 'lucide-react';
import * as api from '../services/api';
import { confirmDialog } from './ConfirmDialog';

// Tanggal hari ini menurut jam lokal perangkat (WIB), bukan UTC.
const localToday = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Setengah kanan kartu atas Dashboard: siapa saja guru piket HARI INI.
// Satu hari bisa diisi 3-4 guru; nama pengguna yang sedang login diberi
// warna berbeda (butter) plus penanda "Anda" bila ia salah satunya.
// Admin dan kepsek mengelola piket dari sini (tombol Set Guru Piket,
// silang kecil untuk melepas nama) — tab piket di halaman Jadwal
// sudah dihapus, panel ini rumah barunya.
export default function PiketTodayPanel({ user, notify }) {
  const [piketList, setPiketList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: localToday(), teacher_name: '' });
  const [showSuggest, setShowSuggest] = useState(false);
  const [teacherUsers, setTeacherUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'kepsek';
  const myName = user?.name || '';

  const fetchPiket = async () => {
    try {
      const res = await api.getGuruPiket({ date: localToday() });
      setPiketList(res.data || []);
    } catch (e) {
      console.error('Failed fetching guru piket', e);
    }
  };

  useEffect(() => {
    fetchPiket();
  }, []);

  useEffect(() => {
    if (canManage) {
      api
        .getUsers()
        .then((res) => {
          const list = (res.data.data || [])
            .filter((u) => u.role === 'guru')
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));
          setTeacherUsers(list);
        })
        .catch(() => setTeacherUsers([]));
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createGuruPiket({ date: form.date, teacher_name: form.teacher_name });
      notify && notify('success', `Guru Piket ${form.teacher_name} untuk tanggal ${form.date} ditambahkan.`);
      setShowModal(false);
      setForm({ date: localToday(), teacher_name: '' });
      fetchPiket();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal tambah guru piket.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!(await confirmDialog({ message: `Lepas ${p.teacher_name} dari guru piket hari ini?`, confirmText: 'Ya, Lepas', danger: true }))) return;
    try {
      await api.deleteGuruPiket(p.id);
      notify && notify('success', 'Guru piket dilepas.');
      fetchPiket();
    } catch (err) {
      notify && notify('error', 'Gagal melepas guru piket.');
    }
  };

  const iAmPiket = piketList.some((p) => p.teacher_name === myName);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Guru Piket Hari Ini</p>
            <p className="text-xs font-bold text-slate-500">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-full transition-all shrink-0"
          >
            Set Guru Piket
          </button>
        )}
      </div>

      {piketList.length === 0 ? (
        <p className="text-xs text-slate-400 italic mt-4">Belum ada guru piket hari ini.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mt-4">
            {piketList.map((p) => {
              const mine = p.teacher_name === myName;
              return (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-xs font-extrabold ${
                    mine ? 'bg-butter text-ink shadow-tactile' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.teacher_name}
                  {mine && <span className="px-1.5 py-0.5 bg-ink text-white rounded-full text-[9px] font-extrabold uppercase tracking-wide">Anda</span>}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      aria-label={`Lepas ${p.teacher_name} dari piket hari ini`}
                      className={`w-4 h-4 inline-flex items-center justify-center rounded-full transition-colors ${mine ? 'hover:bg-ink/10' : 'hover:bg-slate-200'}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {iAmPiket && (
            <p className="text-[11px] font-bold text-slate-500 mt-3">
              Hari ini Anda bertugas piket: Absen Masuk dan Absen Pulang tersedia untuk Anda di Absen QR.
            </p>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-backdrop-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-pop-in">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Set Guru Piket</h3>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-2xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Guru Piket</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.teacher_name}
                    onChange={(e) => {
                      setForm({ ...form, teacher_name: e.target.value });
                      setShowSuggest(true);
                    }}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Ketik nama guru..."
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showSuggest}
                    aria-label="Nama Guru Piket"
                    className="w-full px-3 py-2 border rounded-2xl text-xs"
                  />
                  {showSuggest &&
                    (() => {
                      const q = form.teacher_name.trim().toLowerCase();
                      const matches = teacherUsers
                        .filter((u) => q === '' || String(u.name).toLowerCase().startsWith(q))
                        .slice(0, 8);
                      if (matches.length === 0) return null;
                      return (
                        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-slate-200 rounded-2xl shadow-lg py-1" role="listbox">
                          {matches.map((u) => (
                            <li key={u.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected="false"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setForm({ ...form, teacher_name: u.name });
                                  setShowSuggest(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 flex items-center justify-between gap-2"
                              >
                                <span>{u.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">Guru</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pilih dari daftar agar namanya persis sama dengan akun guru: nama itulah yang membuka akses absen masuk/pulang pada hari piketnya. Satu hari boleh diisi beberapa guru.</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-semibold">Batal</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-2xl shadow-md disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
