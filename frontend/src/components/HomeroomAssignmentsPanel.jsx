import React, { useState, useEffect } from 'react';
import { Home, Trash2 } from 'lucide-react';
import * as api from '../services/api';
import { confirmDialog } from './ConfirmDialog';
import { CLASSES } from '../constants';

// Panel penugasan wali kelas (khusus admin): satu kelas satu wali,
// ditugaskan di atas akun guru yang sudah ada. Wali kelas memegang
// keputusan naik/tinggal kelas untuk siswa di kelas asuhnya.
export default function HomeroomAssignmentsPanel({ notify }) {
  const [rows, setRows] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({ user_id: '', teacher_name: '', class_name: CLASSES[0] });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [hRes, uRes] = await Promise.all([api.getHomeroomTeachers(), api.getUsers()]);
      setRows(hRes.data.data || []);
      const teachers = (uRes.data.data || []).filter((u) => u.role === 'guru');
      setUsersList(teachers);
      if (teachers.length > 0) {
        setForm((prev) => ({
          ...prev,
          user_id: prev.user_id || teachers[0].id,
          teacher_name: prev.teacher_name || teachers[0].name,
        }));
      }
    } catch (e) {
      console.error('Failed fetching homeroom teachers', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const byClass = {};
  rows.forEach((r) => {
    byClass[r.class_name] = r;
  });

  const handleAssign = async (e) => {
    e.preventDefault();
    const selected = usersList.find((u) => String(u.id) === String(form.user_id));
    setSaving(true);
    try {
      await api.assignHomeroomTeacher({
        user_id: form.user_id,
        teacher_name: selected ? selected.name : form.teacher_name,
        class_name: form.class_name,
      });
      notify && notify('success', `Wali kelas ${form.class_name} berhasil disimpan.`);
      fetchData();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal menyimpan wali kelas.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirmDialog({
      message: `Lepas ${row.teacher_name} sebagai wali kelas ${row.class_name}? Kelas itu tidak punya wali sampai ditugaskan lagi.`,
      confirmText: 'Ya, Lepas',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteHomeroomTeacher(row.id);
      notify && notify('success', `Wali kelas ${row.class_name} dilepas.`);
      fetchData();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal melepas wali kelas.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Home className="w-4 h-4 text-plum" /> Tugaskan Wali Kelas
        </h3>
        <p className="text-[11px] font-semibold text-slate-500 mt-1">
          Satu kelas hanya punya satu wali. Menugaskan guru baru untuk kelas yang sudah punya wali akan menggantikan wali sebelumnya.
          Wali kelas adalah yang memutuskan naik atau tinggal kelas untuk siswa di kelasnya.
        </p>
        <form onSubmit={handleAssign} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className="block text-[11px] font-bold text-slate-500 mb-1">Guru</span>
            <select
              value={form.user_id}
              onChange={(e) => {
                const u = usersList.find((x) => String(x.id) === e.target.value);
                setForm({ ...form, user_id: e.target.value, teacher_name: u ? u.name : '' });
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[11px] font-bold text-slate-500 mb-1">Kelas</span>
            <select
              value={form.class_name}
              onChange={(e) => setForm({ ...form, class_name: e.target.value })}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={saving || usersList.length === 0}
            className="px-4 py-2.5 bg-plum hover:opacity-90 text-white font-bold text-xs rounded-2xl transition-all disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Wali Kelas'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-[18%]">Kelas</th>
                <th className="px-5 py-3">Wali Kelas</th>
                <th className="px-5 py-3 w-[16%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {CLASSES.map((c) => {
                const row = byClass[c];
                return (
                  <tr key={c} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-extrabold text-slate-900">{c}</td>
                    <td className="px-5 py-3">
                      {row ? (
                        <span className="font-bold text-slate-800">{row.teacher_name}</span>
                      ) : (
                        <span className="text-slate-400 font-semibold">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row && (
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          aria-label={`Lepas wali kelas ${c}`}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-alpa hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
