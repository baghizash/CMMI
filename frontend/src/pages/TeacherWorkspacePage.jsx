import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, BookOpen, Save, Eye, UserCheck } from 'lucide-react';
import * as api from '../services/api';
import PaginationBar from '../components/PaginationBar';
import usePagination from '../hooks/usePagination';
import StudentCardModal from '../components/StudentCardModal';

// Ruang kerja guru: Data Siswa dan Nilai Siswa digabung dalam satu halaman
// dengan tombol pill. Semua isi terikat penugasan guru yang login:
// siswa yang tampil hanya dari kelas yang ia ampu (dibatasi backend),
// dan nilai hanya dapat diisi per penugasan (kelas + mapel) miliknya,
// tanpa pemilih kelas/mapel bebas.

const SCORE_FIELDS = ['task_score', 'midterm_score', 'remedial_score', 'final_score'];

export default function TeacherWorkspacePage({ user, notify }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'nilai' ? 'nilai' : 'data';
  const setTab = (t) => setSearchParams(t === 'nilai' ? { tab: 'nilai' } : {}, { replace: true });

  const [scope, setScope] = useState({ classes: [], subjects: [], assignments: [] });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [classFilter, setClassFilter] = useState('Semua Kelas');
  const [cardStudent, setCardStudent] = useState(null);

  const [activeAssignment, setActiveAssignment] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  // Scope + students (backend membatasi siswa ke kelas ampuan guru)
  useEffect(() => {
    (async () => {
      try {
        const [scopeRes, stuRes] = await Promise.all([api.getMyTeacherScope(), api.getStudents({})]);
        setScope(scopeRes.data || { classes: [], subjects: [], assignments: [] });
        setStudents(Array.isArray(stuRes.data) ? stuRes.data : []);
        const assignments = scopeRes.data?.assignments || [];
        if (assignments.length > 0) setActiveAssignment(assignments[0]);
      } catch (e) {
        console.error('Failed loading teacher workspace', e);
        notify && notify('error', 'Gagal memuat ruang kerja guru.');
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [user]);

  const filteredStudents = useMemo(
    () => (classFilter === 'Semua Kelas' ? students : students.filter((s) => s.class_name === classFilter)),
    [students, classFilter]
  );
  const studentPager = usePagination(filteredStudents, 5, [classFilter]);

  // Matrix for the active assignment
  const fetchMatrix = async (assignment) => {
    if (!assignment) return;
    setLoadingMatrix(true);
    try {
      const res = await api.getGroupedGrades({ class_name: assignment.class_name, subject_name: assignment.subject_name });
      setMatrix(res.data.students || []);
    } catch (e) {
      console.error('Failed fetching matrix', e);
      notify && notify('error', e.response?.data?.message || 'Gagal memuat data nilai murid.');
      setMatrix([]);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (tab === 'nilai' && activeAssignment) fetchMatrix(activeAssignment);
  }, [tab, activeAssignment]);

  const handleScoreChange = (index, field, value) => {
    const updated = [...matrix];
    updated[index][field] = value;
    const scores = [];
    SCORE_FIELDS.forEach((f) => {
      const v = updated[index][f];
      if (v !== '' && v !== null && v !== undefined && !isNaN(parseFloat(v))) scores.push(parseFloat(v));
    });
    updated[index].final_total = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    setMatrix(updated);
  };

  const handleSave = async () => {
    if (!activeAssignment) return;
    setSaving(true);
    try {
      const payload = {
        class_name: activeAssignment.class_name,
        subject_name: activeAssignment.subject_name,
        grades: matrix.map((st) => ({
          student_id: st.student_id,
          task_score: st.task_score,
          midterm_score: st.midterm_score,
          remedial_score: st.remedial_score,
          final_score: st.final_score,
        })),
      };
      const res = await api.postBatchGrades(payload);
      notify && notify('success', res.data.message || 'Nilai siswa berhasil disimpan!');
      fetchMatrix(activeAssignment);
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal menyimpan nilai.');
    } finally {
      setSaving(false);
    }
  };

  const pillCls = (active) =>
    `px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
      active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-200/50'
    }`;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header + pill toggle */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Ruang Kerja Guru</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Siswa dan nilai dari kelas ampuan Anda
            {scope.classes.length > 0 && <> · {scope.classes.join(', ')}</>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60" role="tablist" aria-label="Pilih fitur">
          <button type="button" role="tab" aria-selected={tab === 'data'} onClick={() => setTab('data')} className={pillCls(tab === 'data')}>
            <GraduationCap className="w-4 h-4" /> Data Siswa
          </button>
          <button type="button" role="tab" aria-selected={tab === 'nilai'} onClick={() => setTab('nilai')} className={pillCls(tab === 'nilai')}>
            <BookOpen className="w-4 h-4" /> Nilai Siswa
          </button>
        </div>
      </div>

      {tab === 'data' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold text-slate-500" htmlFor="tw-class-filter">Kelas:</label>
            <select
              id="tw-class-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option>Semua Kelas</option>
              {scope.classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="text-xs font-semibold text-slate-400">{filteredStudents.length} siswa</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-[14%]">NIS</th>
                    <th className="px-6 py-4 w-[36%]">Nama Siswa</th>
                    <th className="px-6 py-4 w-[18%]">Kelas</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">
                        {loadingStudents ? 'Memuat data siswa...' : 'Tidak ada siswa di kelas ampuan Anda.'}
                      </td>
                    </tr>
                  ) : (
                    studentPager.pageItems.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{st.nis}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/students/${st.id}`)}
                            className="font-bold text-slate-900 hover:text-marine-deep underline-offset-2 hover:underline text-left"
                          >
                            {st.name}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-xl font-bold text-slate-700">{st.class_name}</span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setCardStudent(st)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-marine/10 hover:bg-marine/15 text-marine-deep rounded-full font-bold text-[11px] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </button>
                          <button
                            onClick={() => navigate(`/students/${st.id}/nilai`)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-tang/10 hover:bg-tang/15 text-tang-dark rounded-full font-bold text-[11px] transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Nilai
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredStudents.length > 0 && (
              <PaginationBar page={studentPager.page} totalPages={studentPager.totalPages} total={studentPager.total} perPage={studentPager.perPage} onPageChange={studentPager.setPage} />
            )}
          </div>
        </div>
      )}

      {tab === 'nilai' && (
        <div className="space-y-6">
          {/* Riwayat & tugas aktif penugasan guru */}
          <section aria-label="Penugasan saya">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-amber-600" /> Penugasan Saya
            </h3>
            {scope.assignments.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-white border border-slate-200/80 rounded-3xl px-5 py-6 text-center">
                Belum ada penugasan untuk Anda. Penugasan diatur oleh admin di halaman Jadwal & Penugasan.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scope.assignments.map((a) => {
                  const isActive =
                    activeAssignment &&
                    activeAssignment.class_name === a.class_name &&
                    activeAssignment.subject_name === a.subject_name;
                  return (
                    <button
                      key={a.id ?? `${a.class_name}-${a.subject_name}`}
                      type="button"
                      onClick={() => setActiveAssignment(a)}
                      aria-pressed={!!isActive}
                      className={`text-left p-4 rounded-3xl border transition-all ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'bg-white border-slate-200/80 hover:border-indigo-300'
                      }`}
                    >
                      <p className={`text-sm font-extrabold ${isActive ? 'text-white' : 'text-slate-900'}`}>{a.subject_name}</p>
                      <p className={`text-[11px] font-semibold mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                        Kelas {a.class_name}
                        {a.created_at && ` · sejak ${new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isActive ? 'Tugas Aktif' : 'Pilih untuk mengisi nilai'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Matrix for the active assignment */}
          {activeAssignment && (
            <section aria-label="Matriks nilai penugasan aktif" className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {activeAssignment.subject_name} · Kelas {activeAssignment.class_name}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">Isi nilai murid di kelas ampuan Anda untuk mata pelajaran ini.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || matrix.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Nilai'}
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
                    {matrix.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          {loadingMatrix ? 'Memuat data murid...' : 'Tidak ada data murid di kelas ini.'}
                        </td>
                      </tr>
                    ) : (
                      matrix.map((st, idx) => (
                        <tr key={st.student_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{st.nis}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{st.name}</td>
                          {SCORE_FIELDS.map((field) => (
                            <td key={field} className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={st[field] ?? ''}
                                onChange={(e) => handleScoreChange(idx, field, e.target.value)}
                                placeholder="0-100"
                                className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-800 bg-slate-50/50"
                              />
                            </td>
                          ))}
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
                              {st.final_total !== null && st.final_total !== undefined ? st.final_total : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {cardStudent && <StudentCardModal student={cardStudent} onClose={() => setCardStudent(null)} />}
    </div>
  );
}
