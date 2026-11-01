import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Award, BookOpen } from 'lucide-react';
import * as api from '../services/api';

// Jendela TERPISAH dari kartu siswa: Detail Nilai menampilkan riwayat
// nilai siswa per semester, lalu per mata pelajaran, dengan komponen
// lengkap (tugas, UTS, remedial, UAS, nilai akhir berbobot, status batch).
// Sumber data: /api/grades/student/{id} (subject_grades, semua semester
// secara bawaan sehingga arsip semester lama tetap terbaca).
// Data masuk tidak pernah ditampilkan di kartu siswa itu sendiri.

const PASS_THRESHOLD = 75;

const STATUS_LABEL = {
  draft: 'Draft',
  submitted: 'Terkirim',
  verified: 'Terverifikasi',
  locked: 'Terkunci',
};

const fmtScore = (v) =>
  v === null || v === undefined || v === '' ? '–' : String(v).replace(/\.0$/, '');

export default function StudentGradesModal({ student, onClose, notify }) {
  const [data, setData] = useState(null); // { student, semesters, pass_threshold }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    let alive = true;
    setLoading(true);
    api
      .getStudentGrades(student.id)
      .then((res) => {
        if (!alive) return;
        setData(res.data);
      })
      .catch(() => {
        if (!alive) return;
        notify && notify('error', 'Gagal memuat detail nilai siswa.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [student, notify]);

  const blocks = useMemo(() => data?.semesters || [], [data]);
  const threshold = data?.pass_threshold ?? PASS_THRESHOLD;
  const totalRows = blocks.reduce((a, b) => a + (b.grades?.length || 0), 0);

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail nilai ${student.name}`}
    >
      <button
        type="button"
        aria-label="Tutup detail nilai"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(24,32,44,0.45)] backdrop-blur-[3px] cursor-default"
      />
      <div className="relative w-full max-w-2xl max-h-[86vh] overflow-y-auto bg-[#FBF8F2] rounded-[24px] shadow-[0_24px_64px_rgba(24,32,44,0.35)] animate-pop-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FBF8F2]/95 backdrop-blur px-6 pt-5 pb-4 border-b border-[rgba(30,39,50,0.08)] flex items-start gap-4">
          <div
            className="w-11 h-11 shrink-0 rounded-2xl bg-tang/15 text-tang-dark flex items-center justify-center"
            aria-hidden="true"
          >
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-ink tracking-tight truncate">Detail Nilai · {student.name}</h2>
            <p className="text-xs font-semibold text-ink-soft">
              NIS {student.nis} · Kelas {student.class_name} · {totalRows} mata pelajaran tercatat · tuntas ≥ {threshold}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-full bg-white border border-[rgba(30,39,50,0.09)] text-ink-soft hover:text-ink transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <p className="text-sm text-ink-soft py-10 text-center">Memuat nilai...</p>
          ) : totalRows === 0 ? (
            <p className="text-sm text-ink-soft py-10 text-center">Belum ada nilai tercatat untuk siswa ini.</p>
          ) : (
            <div className="space-y-6">
              {blocks.map((block) => (
                <section key={block.semester.id} aria-label={`Nilai ${block.semester.label}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-marine" aria-hidden="true" />
                    <h3 className="text-sm font-extrabold text-ink">
                      Semester {block.semester.label}
                      {block.semester.is_active && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-hadir/10 text-hadir text-[10px] font-extrabold align-middle">
                          Aktif
                        </span>
                      )}
                    </h3>
                  </div>
                  {!block.grades || block.grades.length === 0 ? (
                    <p className="text-xs text-ink-soft italic">Tidak ada nilai pada semester ini.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-[rgba(30,39,50,0.08)] bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-ink-soft font-bold uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3">Mata Pelajaran</th>
                            <th className="px-2 py-3 text-center">Tugas</th>
                            <th className="px-2 py-3 text-center">UTS</th>
                            <th className="px-2 py-3 text-center">Remedial</th>
                            <th className="px-2 py-3 text-center">UAS</th>
                            <th className="px-3 py-3 text-center">Akhir</th>
                            <th className="px-3 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(30,39,50,0.06)] font-medium">
                          {block.grades.map((g) => {
                            const passed = g.final_total !== null && g.final_total !== undefined
                              ? parseFloat(g.final_total) >= threshold
                              : null;
                            return (
                              <tr key={g.id}>
                                <td className="px-4 py-3 font-bold text-ink">{g.subject_name}</td>
                                <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.task_score)}</td>
                                <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.midterm_score)}</td>
                                <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.remedial_score)}</td>
                                <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.final_score)}</td>
                                <td className="px-3 py-3 text-center">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg font-extrabold inline-block ${
                                      passed === null
                                        ? 'bg-slate-50 text-ink-soft'
                                        : passed
                                          ? 'bg-hadir/10 text-hadir'
                                          : 'bg-alpa/10 text-alpa'
                                    }`}
                                  >
                                    {g.final_total === null || g.final_total === undefined ? '–' : fmtScore(g.final_total)}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center text-ink-soft font-semibold">
                                  {STATUS_LABEL[g.status] || g.status || 'Draft'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold text-ink-soft">
              Nilai akhir = Tugas 20% + UTS 30% + UAS 50%. Remedial menggantikan UAS bila lebih tinggi.
            </p>
            <Link
              to={`/students/${student.id}/nilai`}
              className="h-10 px-4 rounded-full bg-marine text-white text-xs font-bold inline-flex items-center hover:bg-marine-deep transition-colors"
            >
              Buka Transkrip Nilai
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
