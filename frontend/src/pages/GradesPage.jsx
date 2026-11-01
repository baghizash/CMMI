import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Send, ShieldCheck, Lock, Undo2 } from 'lucide-react';
import * as api from '../services/api';
import { CLASSES, SUBJECTS } from '../constants';

// Ambang tuntas yang sama dengan SubjectGrade::PASS_THRESHOLD di backend.
const PASS_THRESHOLD = 75;

// Lencana status batch nilai.
const STATUS_META = {
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-600' },
  submitted: { label: 'Terkirim', cls: 'bg-sky-100 text-sky-800' },
  verified: { label: 'Terverifikasi', cls: 'bg-violet-100 text-violet-800' },
  locked: { label: 'Terkunci', cls: 'bg-emerald-100 text-emerald-800' },
  mixed: { label: 'Status tidak seragam', cls: 'bg-amber-100 text-amber-800' },
};

// Pratinjau nilai akhir berbobot, meniru rumus server (sumber kebenaran
// tetap SubjectGrade::computeFinalTotal): Tugas 20%, UTS 30%, UAS 50%.
// Remedial menggantikan UAS bila lebih tinggi. Komponen kosong dikeluarkan
// dan bobot sisanya dinormalisasi.
function computeWeightedFinal(row) {
  const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(parseFloat(v)) ? null : parseFloat(v));
  const task = num(row.task_score);
  const midterm = num(row.midterm_score);
  const remedial = num(row.remedial_score);
  let exam = num(row.final_score);
  if (remedial !== null && (exam === null || remedial > exam)) exam = remedial;
  const parts = [];
  if (task !== null) parts.push([0.2, task]);
  if (midterm !== null) parts.push([0.3, midterm]);
  if (exam !== null) parts.push([0.5, exam]);
  if (parts.length === 0) return null;
  const weightSum = parts.reduce((a, [w]) => a + w, 0);
  return Math.round((parts.reduce((a, [w, v]) => a + w * v, 0) / weightSum) * 10) / 10;
}

export default function GradesPage({ user, notify }) {
  // Teacher Scope State
  const [scope, setScope] = useState({ is_admin: true, classes: [], subjects: [], assignments: [] });
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);

  // Grouped Grade Data State
  const [studentsGrades, setStudentsGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  // Semester context + batch workflow state
  const [activeSemester, setActiveSemester] = useState(null);
  const [batchStatus, setBatchStatus] = useState('draft');
  const [transitionBusy, setTransitionBusy] = useState(false);

  const isAdminType = user && (user.role === 'admin' || user.role === 'kepsek');
  const canEdit = batchStatus === 'draft';

  // Fetch active semester (konteks semua nilai di halaman ini)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getActiveSemester();
        setActiveSemester(res.data?.data || null);
      } catch (e) {
        console.error('Failed fetching active semester', e);
      }
    })();
  }, []);

  // Fetch Teacher Scope
  useEffect(() => {
    const fetchScope = async () => {
      try {
        const res = await api.getMyTeacherScope();
        setScope(res.data);

        // Auto-select first available class & subject for scoped teacher
        if (!res.data.is_admin && res.data.classes.length > 0) {
          setSelectedClass(res.data.classes[0]);
        }
        if (!res.data.is_admin && res.data.subjects.length > 0) {
          setSelectedSubject(res.data.subjects[0]);
        }
      } catch (e) {
        console.error('Failed fetching teacher scope', e);
      }
    };
    fetchScope();
  }, [user]);

  // Fetch Grouped Grades whenever class or subject changes
  const fetchGroupedGrades = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoadingGrades(true);
    try {
      const res = await api.getGroupedGrades({ class_name: selectedClass, subject_name: selectedSubject });
      setStudentsGrades(res.data.students || []);
      setBatchStatus(res.data.batch_status || 'draft');
    } catch (e) {
      console.error('Failed fetching grouped grades', e);
      notify && notify('error', e.response?.data?.message || 'Gagal memuat data nilai murid.');
      setStudentsGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    fetchGroupedGrades();
  }, [selectedClass, selectedSubject]);

  // Handle local state change in matrix table input
  const handleScoreChange = (index, field, value) => {
    const updated = [...studentsGrades];
    updated[index][field] = value;
    updated[index].final_total = computeWeightedFinal(updated[index]);
    setStudentsGrades(updated);
  };

  // Save Matrix Batch Grades
  const handleSaveBatchGrades = async () => {
    setSavingGrades(true);
    try {
      const payload = {
        class_name: selectedClass,
        subject_name: selectedSubject,
        grades: studentsGrades.map((st) => ({
          student_id: st.student_id,
          task_score: st.task_score,
          midterm_score: st.midterm_score,
          remedial_score: st.remedial_score,
          final_score: st.final_score,
        })),
      };
      const res = await api.postBatchGrades(payload);
      notify && notify('success', res.data.message || 'Nilai siswa berhasil disimpan!');
      fetchGroupedGrades();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal menyimpan nilai.');
    } finally {
      setSavingGrades(false);
    }
  };

  // Workflow transitions: submit / verify / lock / unlock (server-enforced)
  const handleTransition = async (action) => {
    const calls = {
      submit: api.submitGradesBatch,
      verify: api.verifyGradesBatch,
      lock: api.lockGradesBatch,
      unlock: api.unlockGradesBatch,
    };
    setTransitionBusy(true);
    try {
      const res = await calls[action]({ class_name: selectedClass, subject_name: selectedSubject });
      notify && notify('success', res.data.message || 'Status nilai berhasil diperbarui.');
      fetchGroupedGrades();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal memperbarui status nilai.');
    } finally {
      setTransitionBusy(false);
    }
  };

  const availableClasses = !scope.is_admin && scope.classes.length > 0 ? scope.classes : CLASSES;
  const availableSubjects = !scope.is_admin && scope.subjects.length > 0 ? scope.subjects : SUBJECTS;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Nilai Akademik Siswa</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Pengelompokan Matriks Nilai: <span className="font-bold text-indigo-600">Kelas ➔ Mata Pelajaran ➔ Daftar Murid</span>
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Semester Aktif:{' '}
            <span className="font-bold text-slate-800">
              {activeSemester ? activeSemester.label : 'belum diatur'}
            </span>{' '}
            · Nilai akhir = Tugas 20% + UTS 30% + UAS 50% (remedial menggantikan UAS bila lebih tinggi), tuntas ≥ {PASS_THRESHOLD}
          </p>
        </div>

      </div>

      {/* MATRIX INPUT GRADES (Kelas -> Mapel -> Murid) */}
        <div className="space-y-6">
          {/* Class & Subject Hierarchy Selectors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">1. Pilih Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {availableClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">2. Pilih Mata Pelajaran</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 flex justify-end pt-5">
              <button
                onClick={handleSaveBatchGrades}
                disabled={savingGrades || studentsGrades.length === 0 || !canEdit}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {savingGrades ? 'Menyimpan...' : 'Simpan Draft'}
              </button>
            </div>
          </div>

          {/* Matrix Student Grades Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Daftar Murid {selectedClass} — Mapel: <span className="text-indigo-600 font-black">{selectedSubject}</span>
                </h3>
                <p className="text-[11px] text-slate-500">Total {studentsGrades.length} Murid</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold ${STATUS_META[batchStatus]?.cls || STATUS_META.draft.cls}`}>
                  Status: {STATUS_META[batchStatus]?.label || batchStatus}
                </span>
                {batchStatus === 'draft' && (
                  <button
                    onClick={() => handleTransition('submit')}
                    disabled={transitionBusy || studentsGrades.length === 0}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-full flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Kirim
                  </button>
                )}
                {isAdminType && batchStatus === 'submitted' && (
                  <button
                    onClick={() => handleTransition('verify')}
                    disabled={transitionBusy}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] rounded-full flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verifikasi
                  </button>
                )}
                {isAdminType && batchStatus === 'verified' && (
                  <button
                    onClick={() => handleTransition('lock')}
                    disabled={transitionBusy}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-full flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" /> Kunci
                  </button>
                )}
                {isAdminType && (batchStatus === 'submitted' || batchStatus === 'verified' || batchStatus === 'locked') && (
                  <button
                    onClick={() => handleTransition('unlock')}
                    disabled={transitionBusy}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-full flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Buka Kunci
                  </button>
                )}
                <button
                  onClick={fetchGroupedGrades}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                  title="Refresh Data Nilai"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingGrades ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">NIS</th>
                    <th className="px-6 py-4">Nama Murid</th>
                    <th className="px-4 py-4 text-center">Nilai Tugas</th>
                    <th className="px-4 py-4 text-center">Nilai UTS</th>
                    <th className="px-4 py-4 text-center">Remedial</th>
                    <th className="px-4 py-4 text-center">Nilai UAS</th>
                    <th className="px-6 py-4 text-center">Nilai Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {studentsGrades.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        {loadingGrades ? 'Memuat data murid...' : 'Tidak ada data murid di kelas ini.'}
                      </td>
                    </tr>
                  ) : (
                    studentsGrades.map((st, idx) => (
                      <tr key={st.student_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{st.nis}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{st.name}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={st.task_score ?? ''}
                            onChange={(e) => handleScoreChange(idx, 'task_score', e.target.value)}
                            placeholder="0-100" disabled={!canEdit}
                            className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 bg-slate-50/50"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={st.midterm_score ?? ''}
                            onChange={(e) => handleScoreChange(idx, 'midterm_score', e.target.value)}
                            placeholder="0-100" disabled={!canEdit}
                            className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 bg-slate-50/50"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={st.remedial_score ?? ''}
                            onChange={(e) => handleScoreChange(idx, 'remedial_score', e.target.value)}
                            placeholder="0-100" disabled={!canEdit}
                            className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 bg-slate-50/50"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={st.final_score ?? ''}
                            onChange={(e) => handleScoreChange(idx, 'final_score', e.target.value)}
                            placeholder="0-100" disabled={!canEdit}
                            className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 bg-slate-50/50"
                          />
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-xl font-extrabold text-xs inline-block ${
                              st.final_total >= PASS_THRESHOLD
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.final_total !== null
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {st.final_total !== null ? st.final_total : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
}
