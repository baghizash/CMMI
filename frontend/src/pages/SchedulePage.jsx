import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, UserCog, BookOpen } from 'lucide-react';
import * as api from '../services/api';
import PaginationBar from '../components/PaginationBar';
import usePagination from '../hooks/usePagination';
import { CLASSES, DAYS, SUBJECTS } from '../constants';
import TeacherAssignmentsPanel from '../components/TeacherAssignmentsPanel';

export default function SchedulePage({ user, notify }) {

  const [schedules, setSchedules] = useState([]);
  const [piketList, setPiketList] = useState([]);
  const piketPager = usePagination(piketList, 5, []);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('jadwal'); // 'jadwal' | 'mapel' | 'piket'
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
        api.getSchedules({}),
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
  }, []);

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
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Jadwal & Penugasan</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Jadwal pelajaran, penugasan guru mapel, dan guru piket dalam satu halaman</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60" role="tablist" aria-label="Pilih fitur">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'jadwal'}
            onClick={() => setActiveTab('jadwal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'jadwal' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            Jadwal Mapel
          </button>
          {user?.role === 'admin' && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'mapel'}
              onClick={() => setActiveTab('mapel')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'mapel' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'text-slate-600 hover:bg-slate-200/50'}`}
            >
              Penugasan Guru Mapel
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'piket'}
            onClick={() => setActiveTab('piket')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'piket' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            Guru Piket
          </button>
        </div>
      </div>

      {/* Tab panels */}
      {activeTab === 'jadwal' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">
              {DAYS.length} hari efektif · {schedules.length} jadwal pelajaran dari semua kelas
            </p>
            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {DAYS.map((day) => {
              const daySchedules = schedules
                .filter((s) => s.day === day)
                .sort((x, y) => String(x.class_name).localeCompare(String(y.class_name)) || x.period - y.period);
              return (
                <section key={day} aria-label={`Jadwal hari ${day}`} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                  <header className="px-5 py-4 bg-plum/5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">{day}</h3>
                    <span className="px-2.5 py-1 bg-plum/10 text-plum rounded-full text-[10px] font-extrabold">
                      {daySchedules.length} pelajaran
                    </span>
                  </header>
                  {daySchedules.length === 0 ? (
                    <p className="px-5 py-8 text-xs text-slate-400 italic text-center">Belum ada jadwal di hari ini.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {daySchedules.map((sch) => (
                        <li key={sch.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/80 transition-colors">
                          <div className="shrink-0 w-14">
                            <p className="text-[11px] font-extrabold text-indigo-600">Jam {sch.period}</p>
                            <p className="text-[10px] font-mono text-slate-500">{sch.start_time}–{sch.end_time}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{sch.subject_name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{sch.teacher_name || 'Guru belum diisi'}</p>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 bg-plum/10 text-plum rounded-xl text-[10px] font-extrabold">{sch.class_name}</span>
                          <button
                            onClick={() => handleDeleteSchedule(sch.id)}
                            className="shrink-0 p-1.5 text-slate-400 hover:text-rose-600 rounded-xl"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'piket' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <UserCog className="w-4 h-4 text-amber-600" /> Guru Piket Hari Ini
            </h3>
            <button
              onClick={() => setShowAddPiketModal(true)}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-2xl transition-all flex items-center gap-2"
            >
              <UserCog className="w-4 h-4" /> Set Guru Piket
            </button>
          </div>
          {piketList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada guru piket terdaftar hari ini.</p>
          ) : (
            <div className="space-y-2">
              {piketPager.pageItems.map((p) => (
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
          {piketList.length > 0 && (
            <PaginationBar page={piketPager.page} totalPages={piketPager.totalPages} total={piketPager.total} perPage={piketPager.perPage} onPageChange={piketPager.setPage} />
          )}
        </div>
      )}

      {activeTab === 'mapel' && user?.role === 'admin' && (
        <TeacherAssignmentsPanel notify={notify} />
      )}

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
