import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import * as api from '../services/api';

// Panel keputusan naik kelas untuk wali kelas: per siswa tampil
// ringkasan nilai semester aktif (rata-rata, mapel di bawah KKTP,
// usulan sistem), dan wali kelas memberi keputusan final naik atau
// tinggal (kelas 6: lulus atau tinggal). Keputusan tersimpan sebagai
// arsip dan dijalankan admin lewat tombol Semester Baru.
export default function PromotionDecisionsPanel({ notify }) {
  const [semester, setSemester] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.getPromotionClasses();
      setSemester(res.data.semester || null);
      const list = res.data.classes || [];
      setClasses(list);
      if (list.length > 0) {
        setActiveClass((prev) => (prev && list.some((c) => c.class_name === prev) ? prev : list[0].class_name));
      }
    } catch (e) {
      console.error('Failed loading promotion classes', e);
      notify && notify('error', 'Gagal memuat data keputusan naik kelas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const decide = async (student, decision) => {
    setBusyId(student.student_id);
    try {
      const res = await api.decidePromotion({ student_id: student.student_id, decision });
      notify && notify('success', res.data.message || 'Keputusan tersimpan.');
      fetchData();
    } catch (err) {
      notify && notify('error', err.response?.data?.message || 'Gagal menyimpan keputusan.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500 py-10 text-center">Memuat keputusan naik kelas...</p>;
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm px-6 py-12 text-center">
        <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Anda belum ditugaskan sebagai wali kelas.</p>
        <p className="text-xs font-semibold text-slate-400 mt-1">Minta admin menugaskan Anda lewat menu Penugasan Wali Kelas.</p>
      </div>
    );
  }

  const current = classes.find((c) => c.class_name === activeClass) || classes[0];
  const decidedCount = current.students.filter((s) => s.decision).length;
  const isGrade6 = /^6[AB]$/.test(current.class_name);
  const fmt = (v) => (v === null || v === undefined ? '–' : Number(v).toFixed(1).replace(/\.0$/, ''));

  const proposalBadge = (s) => {
    if (s.summary.proposal === 'belum-lengkap') {
      return <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold">Nilai belum lengkap ({s.summary.subjects_graded}/{s.summary.subjects_total})</span>;
    }
    if (s.summary.proposal === 'tinggal') {
      return <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-50 text-alpa text-[10px] font-extrabold">Usulan sistem: Tinggal Kelas</span>;
    }
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-hadir text-[10px] font-extrabold">Usulan sistem: {isGrade6 ? 'Lulus' : 'Naik Kelas'}</span>;
  };

  const decisionBadge = (s) => {
    if (!s.decision) return null;
    if (s.decision === 'lulus') return <span className="inline-flex px-2 py-0.5 rounded-full bg-plum/10 text-plum text-[10px] font-extrabold">Keputusan: LULUS</span>;
    if (s.decision === 'naik') return <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-hadir text-[10px] font-extrabold">Keputusan: NAIK KELAS</span>;
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-50 text-telat text-[10px] font-extrabold">Keputusan: TINGGAL KELAS</span>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-hadir" /> Keputusan Naik Kelas
              {semester && <span className="text-slate-400 font-bold">· Semester {semester.label}</span>}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              Usulan sistem dihitung dari nilai semester ini (rata-rata di bawah 75 atau lebih dari 2 mapel di bawah KKTP 75 diusulkan tinggal kelas).
              Keputusan final tetap di tangan Anda sebagai wali kelas, dan dijalankan admin saat semester baru dimulai.
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold ${decidedCount === current.students.length ? 'bg-emerald-50 text-hadir' : 'bg-amber-50 text-telat'}`}>
            {decidedCount === current.students.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {decidedCount} dari {current.students.length} siswa diputuskan
          </span>
        </div>

        {classes.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {classes.map((c) => (
              <button
                key={c.class_name}
                type="button"
                onClick={() => setActiveClass(c.class_name)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold transition-all ${c.class_name === current.class_name ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Kelas {c.class_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {current.students.map((s) => (
          <div key={s.student_id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900">{s.name} <span className="text-slate-400 font-bold text-[11px]">· NIS {s.nis}</span></p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Rata-rata {fmt(s.summary.average)} · {s.summary.subjects_graded} dari {s.summary.subjects_total} mapel ternilai
                </p>
                {s.summary.below_kktp.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.summary.below_kktp.map((b) => (
                      <span key={b.subject_name} className="inline-flex px-2 py-0.5 rounded-full bg-rose-50 text-alpa text-[10px] font-bold">
                        {b.subject_name} {fmt(b.final_total)}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {proposalBadge(s)}
                  {decisionBadge(s)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={busyId === s.student_id}
                  onClick={() => decide(s, 'naik')}
                  className={`px-3.5 py-2 rounded-full text-[11px] font-extrabold transition-all disabled:opacity-50 ${s.decision === 'naik' || s.decision === 'lulus' ? 'bg-hadir text-white' : 'bg-emerald-50 text-hadir hover:bg-hadir hover:text-white'}`}
                >
                  {isGrade6 ? 'Lulus' : 'Naik Kelas'}
                </button>
                <button
                  type="button"
                  disabled={busyId === s.student_id}
                  onClick={() => decide(s, 'tinggal')}
                  className={`px-3.5 py-2 rounded-full text-[11px] font-extrabold transition-all disabled:opacity-50 ${s.decision === 'tinggal' ? 'bg-telat text-white' : 'bg-amber-50 text-telat hover:bg-telat hover:text-white'}`}
                >
                  Tinggal Kelas
                </button>
              </div>
            </div>
          </div>
        ))}
        {current.students.length === 0 && (
          <p className="text-sm text-slate-400 font-semibold text-center py-8">Belum ada siswa aktif di kelas ini.</p>
        )}
      </div>
    </div>
  );
}
