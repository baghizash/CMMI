import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, UserCog, BookOpen } from 'lucide-react';
import * as api from '../services/api';
import { CLASSES, DAYS, SUBJECTS } from '../constants';

export default function SchedulePage({ user, notify }) {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedDay, setSelectedDay] = useState('Senin');

  const [schedules, setSchedules] = useState([]);
  const [piketList, setPiketList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddPiketModal, setShowAddPiketModal] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    day: 'Senin',
    period: 1,
    class_name: CLASSES[0],
    subject_name: SUBJECTS[0],
    teacher_name: '',
    start_time: '07:30',
    end_time: '08:15',
    room: '',
  });

  const [newPiket, setNewPiket] = useState({
    date: new Date().toISOString().split('T')[0],
    teacher_name: '',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schRes, piketRes] = await Promise.all([
        api.getSchedules({ class_name: selectedClass, day: selectedDay }),
        api.getGuruPiket({ date: new Date().toISOString().split('T')[0] }),
      ]);
      setSchedules(schRes.data || []);
      setPiketList(piketRes.data || []);
    } catch (e) {
      console.error('Failed fetching schedule data', e);
      notify && notify('error', 'Gagal memuat jadwal & guru piket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, selectedDay]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.createSchedule(newSchedule);
      notify && notify('success', 'Jadwal pelajaran ditambahkan.');
      setShowAddScheduleModal(false);
      fetchData();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal tambah jadwal.');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Hapus jadwal pelajaran ini?')) return;
    try {
      await api.deleteSchedule(id);
      notify && notify('success', 'Jadwal dihapus.');
      fetchData();
    } catch (e) {
      notify && notify('error', 'Gagal hapus jadwal.');
    }
  };

  const handleAddPiket = async (e) => {
    e.preventDefault();
    try {
      await api.createGuruPiket(newPiket);
      notify && notify('success', 'Guru Piket ditambahkan.');
      setShowAddPiketModal(false);
      fetchData();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal tambah guru piket.');
    }
  };

  const handleDeletePiket = async (id) => {
    if (!window.confirm('Hapus guru piket ini?')) return;
    try {
      await api.deleteGuruPiket(id);
      notify && notify('success', 'Guru piket dihapus.');
      fetchData();
    } catch (e) {
      notify && notify('error', 'Gagal hapus guru piket.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Jadwal Pelajaran & Guru Piket</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Kelola alokasi mata pelajaran & petugas piket harian</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddPiketModal(true)}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-2xl transition-all flex items-center gap-2"
          >
            <UserCog className="w-4 h-4" /> Set Guru Piket
          </button>

          <button
            onClick={() => setShowAddScheduleModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Hari:</span>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Schedule Table + Guru Piket Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Jadwal Kelas {selectedClass} - Hari {selectedDay}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Jam Ke-</th>
                  <th className="px-6 py-3.5">Waktu</th>
                  <th className="px-6 py-3.5">Mata Pelajaran</th>
                  <th className="px-6 py-3.5">Guru Pengajar</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Belum ada jadwal tersimpan untuk kelas & hari ini.
                    </td>
                  </tr>
                ) : (
                  schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-indigo-600">Ke-{sch.period}</td>
                      <td className="px-6 py-4 font-mono">{sch.start_time} - {sch.end_time}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{sch.subject_name}</td>
                      <td className="px-6 py-4">{sch.teacher_name || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guru Piket List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <UserCog className="w-4 h-4 text-amber-600" /> Guru Piket Hari Ini
          </h3>
          {piketList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada guru piket terdaftar hari ini.</p>
          ) : (
            <div className="space-y-2">
              {piketList.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.teacher_name}</p>
                    <p className="text-[10px] text-slate-500">{p.notes || 'Petugas Piket'}</p>
                  </div>
                  <button
                    onClick={() => handleDeletePiket(p.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Jadwal Pelajaran</h3>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={newSchedule.day}
                    onChange={(e) => setNewSchedule({ ...newSchedule, day: e.target.value })}
                    className="w-full px-3 py-2 border rounded-2xl text-xs"
                  >
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Ke-</label>
                  <input
                    type="number"
                    min="1"
                    value={newSchedule.period}
                    onChange={(e) => setNewSchedule({ ...newSchedule, period: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-2xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={newSchedule.class_name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, class_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-2xl text-xs"
                  >
                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={newSchedule.subject_name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, subject_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-2xl text-xs"
                  >
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Guru Pengajar</label>
                <input
                  type="text"
                  required
                  value={newSchedule.teacher_name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, teacher_name: e.target.value })}
                  placeholder="Nama Guru"
                  className="w-full px-3 py-2 border rounded-2xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-2xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-2xl text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddScheduleModal(false)} className="px-4 py-2 text-xs font-semibold">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Piket Modal */}
      {showAddPiketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Set Guru Piket</h3>
            <form onSubmit={handleAddPiket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={newPiket.date}
                  onChange={(e) => setNewPiket({ ...newPiket, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-2xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Guru Piket</label>
                <input
                  type="text"
                  required
                  value={newPiket.teacher_name}
                  onChange={(e) => setNewPiket({ ...newPiket, teacher_name: e.target.value })}
                  placeholder="Nama Guru"
                  className="w-full px-3 py-2 border rounded-2xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddPiketModal(false)} className="px-4 py-2 text-xs font-semibold">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-2xl shadow-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
