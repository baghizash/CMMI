import React, { useState, useEffect } from 'react';
import { BookOpen, Save, UserCheck, Shield, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import * as api from '../services/api';
import PaginationBar from '../components/PaginationBar';
import usePagination from '../hooks/usePagination';
import { CLASSES, SUBJECTS } from '../constants';

export default function GradesPage({ user, notify }) {
  const [activeSubTab, setActiveSubTab] = useState('input_grades'); // 'input_grades' | 'assignments'

  // Teacher Scope State
  const [scope, setScope] = useState({ is_admin: true, classes: [], subjects: [], assignments: [] });
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);

  // Grouped Grade Data State
  const [studentsGrades, setStudentsGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  // Admin Teacher Assignments State
  const [assignments, setAssignments] = useState([]);
  const assignmentPager = usePagination(assignments, 5, [activeSubTab]);
  const [usersList, setUsersList] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    teacher_name: '',
    class_name: CLASSES[0],
    subject_name: SUBJECTS[0],
  });

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

  // Fetch Assignments for Admin
  const fetchAssignments = async () => {
    if (user?.role !== 'admin') return;
    try {
      const [assRes, uRes] = await Promise.all([api.getTeacherAssignments(), api.getUsers()]);
      const fetchedUsers = uRes.data.data || [];
      setAssignments(assRes.data.data || []);
      setUsersList(fetchedUsers);

      if (fetchedUsers.length > 0) {
        setNewAssignment((prev) => ({
          ...prev,
          user_id: prev.user_id || fetchedUsers[0].id,
          teacher_name: prev.teacher_name || fetchedUsers[0].name,
        }));
      }
    } catch (e) {
      console.error('Failed fetching assignments', e);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAssignments();
    }
  }, [user]);

  useEffect(() => {
    if (activeSubTab === 'assignments') {
      fetchAssignments();
    }
  }, [activeSubTab]);

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

  // Add Teacher Assignment (Admin)
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const selectedUserObj = usersList.find((u) => u.id === newAssignment.user_id);
      await api.createTeacherAssignment({
        ...newAssignment,
        teacher_name: selectedUserObj ? selectedUserObj.name : newAssignment.teacher_name,
      });
      notify && notify('success', 'Penugasan guru mapel berhasil disimpan.');
      fetchAssignments();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal menambah penugasan guru.');
    }
  };

  // Delete Teacher Assignment (Admin)
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Hapus penugasan guru ini?')) return;
    try {
      await api.deleteTeacherAssignment(id);
      notify && notify('success', 'Penugasan berhasil dihapus.');
      fetchAssignments();
    } catch (e) {
      notify && notify('error', 'Gagal menghapus penugasan.');
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

        {/* Sub-tab switcher for Admin */}
        {user?.role === 'admin' && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveSubTab('input_grades')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'input_grades'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Matriks Nilai Murid
            </button>
            <button
              onClick={() => setActiveSubTab('assignments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'assignments'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Penugasan Guru Mapel
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: MATRIX INPUT GRADES (Kelas -> Mapel -> Murid) */}
      {activeSubTab === 'input_grades' && (
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
      )}

      {/* VIEW 2: ADMIN TEACHER ASSIGNMENTS MANAGEMENT */}
      {activeSubTab === 'assignments' && user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Assignment Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" /> Penugasan Guru Mapel
            </h3>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Guru</label>
                <select
                  value={newAssignment.user_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const u = usersList.find((usr) => usr.id === selectedId);
                    setNewAssignment({
                      ...newAssignment,
                      user_id: selectedId,
                      teacher_name: u ? u.name : '',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Pilih Guru Terdaftar --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.username} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              {!newAssignment.user_id && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ketik Nama Guru (Manual)</label>
                  <input
                    type="text"
                    required
                    value={newAssignment.teacher_name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, teacher_name: e.target.value })}
                    placeholder="Contoh: Pak Budi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas</label>
                <select
                  value={newAssignment.class_name}
                  onChange={(e) => setNewAssignment({ ...newAssignment, class_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs bg-slate-50 font-semibold"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Mata Pelajaran</label>
                <select
                  value={newAssignment.subject_name}
                  onChange={(e) => setNewAssignment({ ...newAssignment, subject_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-2xl text-xs bg-slate-50 font-semibold"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Simpan Penugasan
              </button>
            </form>
          </div>

          {/* Assignments List */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Daftar Penugasan Guru Mapel ({assignments.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Nama Guru</th>
                    <th className="px-6 py-4">Kelas Ampuan</th>
                    <th className="px-6 py-4">Mata Pelajaran</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">
                        Belum ada penugasan guru mapel.
                      </td>
                    </tr>
                  ) : (
                    assignmentPager.pageItems.map((ass) => (
                      <tr key={ass.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{ass.teacher_name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-xl font-bold">
                            {ass.class_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-xl font-bold">
                            {ass.subject_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteAssignment(ass.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl"
                            title="Hapus Penugasan"
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
            {assignments.length > 0 && (
              <PaginationBar page={assignmentPager.page} totalPages={assignmentPager.totalPages} total={assignmentPager.total} perPage={assignmentPager.perPage} onPageChange={assignmentPager.setPage} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
