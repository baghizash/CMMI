import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import * as api from '../services/api';
import { CLASSES, SUBJECTS } from '../constants';

export default function GradesPage({ user, notify }) {
  // Teacher Scope State
  const [scope, setScope] = useState({ is_admin: true, classes: [], subjects: [], assignments: [] });
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);

  // Grouped Grade Data State
  const [studentsGrades, setStudentsGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

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

    // Auto-recalculate final total (average of non-empty scores)
    const scores = [];
    ['task_score', 'midterm_score', 'remedial_score', 'final_score'].forEach((f) => {
      const v = updated[index][f];
      if (v !== '' && v !== null && v !== undefined && !isNaN(parseFloat(v))) {
        scores.push(parseFloat(v));
      }
    });

    updated[index].final_total = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

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
                disabled={savingGrades || studentsGrades.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {savingGrades ? 'Menyimpan...' : 'Simpan Semua Nilai Kelas'}
              </button>
            </div>
          </div>

          {/* Matrix Student Grades Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Daftar Murid {selectedClass} — Mapel: <span className="text-indigo-600 font-black">{selectedSubject}</span>
                </h3>
                <p className="text-[11px] text-slate-500">Total {studentsGrades.length} Murid</p>
              </div>
              <button
                onClick={fetchGroupedGrades}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
                title="Refresh Data Nilai"
              >
                <RefreshCw className={`w-4 h-4 ${loadingGrades ? 'animate-spin' : ''}`} />
              </button>
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
                            placeholder="0-100"
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
                            placeholder="0-100"
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
                            placeholder="0-100"
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
                            placeholder="0-100"
                            className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 bg-slate-50/50"
                          />
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-xl font-extrabold text-xs inline-block ${
                              st.final_total >= 75
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
