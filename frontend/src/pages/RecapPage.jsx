import React, { useState, useEffect } from 'react';
import {
  Clock, Download, Filter, Plus, Trash2, Calendar, FileSpreadsheet, CheckCircle2, AlertCircle, BookOpen, UserCheck
} from 'lucide-react';
import * as api from '../services/api';
import { CLASSES } from '../constants';

export default function RecapPage({ user, notify }) {
  const isGuruMapel = user?.role === 'guru';
  const [recapTab, setRecapTab] = useState(isGuruMapel ? 'subject' : 'daily'); // daily | subject
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  const [attendance, setAttendance] = useState([]);
  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    student_id: '',
    status: 'Hadir',
    leave_type: '',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const attPromise = isGuruMapel
        ? Promise.resolve({ data: [] })
        : api.getAttendance({ date: selectedDate, class_name: selectedClass, status: statusFilter }).catch(() => ({ data: [] }));

      const subjPromise = api.getSubjectAttendance({ date: selectedDate, class_name: selectedClass }).catch(() => ({ data: [] }));
      const stPromise = api.getStudents({ class_name: selectedClass }).catch(() => ({ data: [] }));

      const [attRes, subjRes, stRes] = await Promise.all([attPromise, subjPromise, stPromise]);

      setAttendance(attRes.data || []);
      setSubjectAttendance(subjRes.data || []);
      setStudents(stRes.data || []);

      if (stRes.data?.length > 0 && !manualData.student_id) {
        setManualData((prev) => ({ ...prev, student_id: stRes.data[0].id }));
      }
    } catch (e) {
      console.error('Failed fetching recap data', e);
      notify && notify('error', 'Gagal memuat rekap absensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedClass, statusFilter]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.manualAttendance({
        ...manualData,
        date: selectedDate,
        recorded_by: user?.name || 'Admin',
      });
      notify && notify('success', 'Berhasil mencatat absensi manual.');
      setShowManualModal(false);
      fetchData();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal catat absensi manual.');
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Hapus baris data absensi ini?')) return;
    try {
      await api.deleteAttendance(id);
      notify && notify('success', 'Data absensi dihapus.');
      fetchData();
    } catch (e) {
      notify && notify('error', 'Gagal menghapus data.');
    }
  };

  const handleExportExcel = () => {
    const url = api.getExcelExport({ date: selectedDate, class_name: selectedClass });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Rekapitulasi Kehadiran</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Laporan absensi harian gerbang & per mata pelajaran</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isGuruMapel && (
            <>
              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Input Manual / Izin
              </button>

              <button
                onClick={handleExportExcel}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 w-fit">
          {!isGuruMapel && (
            <button
              onClick={() => setRecapTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                recapTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Absensi Harian Gerbang
            </button>
          )}
          <button
            onClick={() => setRecapTab('subject')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              recapTab === 'subject'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Absensi Mata Pelajaran
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {recapTab === 'daily' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Hadir">Hadir</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Alpa">Alpa</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table 1: Daily Attendance */}
      {recapTab === 'daily' && !isGuruMapel && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Rekap Absensi Harian Gerbang ({attendance.length} Record)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Waktu Masuk</th>
                  <th className="px-6 py-4">NIS</th>
                  <th className="px-6 py-4">Nama Siswa</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Jam Pulang</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      {loading ? 'Memuat data...' : 'Tidak ada data absensi untuk tanggal & filter ini.'}
                    </td>
                  </tr>
                ) : (
                  attendance.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{row.time}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{row.nis}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{row.student_name}</td>
                      <td className="px-6 py-4">{row.class_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-bold ${
                            row.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'Terlambat'
                              ? 'bg-amber-100 text-amber-800'
                              : row.status === 'Sakit' || row.status === 'Izin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">{row.time_out || '-'}</td>
                      <td className="px-6 py-4 text-slate-500 italic">{row.notes || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteAttendance(row.id)}
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
      )}

      {/* Table 2: Subject Attendance */}
      {recapTab === 'subject' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">Rekap Absensi Per Mata Pelajaran ({subjectAttendance.length} Record)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Waktu Scan</th>
                  <th className="px-6 py-4">NIS</th>
                  <th className="px-6 py-4">Nama Siswa</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4 text-center">Jam Ke-</th>
                  <th className="px-6 py-4">Guru Pengajar</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subjectAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      {loading ? 'Memuat data...' : 'Tidak ada data absensi mata pelajaran untuk tanggal & kelas ini.'}
                    </td>
                  </tr>
                ) : (
                  subjectAttendance.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{row.time}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{row.nis}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{row.student_name}</td>
                      <td className="px-6 py-4">{row.class_name}</td>
                      <td className="px-6 py-4 font-bold text-indigo-700">{row.subject_name}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">Jam {row.period}</td>
                      <td className="px-6 py-4 text-slate-700">{row.teacher_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-xl font-bold bg-emerald-100 text-emerald-800">
                          {row.status || 'Hadir'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Input Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Input Manual / Surat Izin</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  value={manualData.student_id}
                  onChange={(e) => setManualData({ ...manualData, student_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.class_name} - NIS: {st.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Kehadiran</label>
                <select
                  value={manualData.status}
                  onChange={(e) => setManualData({ ...manualData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpa">Alpa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Alasan (Opsional)</label>
                <textarea
                  value={manualData.notes}
                  onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                  placeholder="Misal: Surat dokter tanggal 11 Aug..."
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-md"
                >
                  Simpan Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
