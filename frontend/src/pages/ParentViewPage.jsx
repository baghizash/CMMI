import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import * as api from '../services/api';

// Tampilan Orang Tua (hanya-lihat): pratinjau persis seperti yang kelak
// dilihat orang tua — nilai anak per semester dengan komponen lengkap.
// CATATAN: belum ada akun/peran orang tua di sistem; halaman ini hanya
// bisa dibuka staf yang login (guru dibatasi scope kelasnya di backend).
// Tugas/agenda harian belum ditampilkan karena belum ada model tugas.

const STATUS_LABEL = {
  draft: 'Draft',
  submitted: 'Terkirim',
  verified: 'Terverifikasi',
  locked: 'Terkunci',
};

const fmtScore = (v) =>
  v === null || v === undefined || v === '' ? '–' : String(v).replace(/\.0$/, '');

export default function ParentViewPage({ notify }) {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.getParentView(studentId);
        if (alive) setData(res.data);
      } catch (e) {
        if (alive) {
          setFailed(true);
          notify && notify('error', 'Gagal memuat tampilan orang tua.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [studentId]);

  if (loading) {
    return <p className="text-sm text-ink-soft py-16 text-center">Memuat tampilan orang tua...</p>;
  }

  if (failed || !data?.student) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-bold text-ink">Tampilan orang tua tidak dapat dimuat.</p>
        <button
          type="button"
          onClick={() => navigate('/students')}
          className="mt-4 h-11 px-5 rounded-full bg-marine text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-marine-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Data Siswa
        </button>
      </div>
    );
  }

  const { student, semesters, pass_threshold: threshold } = data;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(`/students/${student.id}/nilai`)}
          aria-label="Kembali ke transkrip nilai"
          className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-full bg-white border border-[rgba(30,39,50,0.09)] text-ink hover:bg-marine/10 hover:text-marine-deep transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-plum/10 text-plum flex items-center justify-center" aria-hidden="true">
          <Users className="w-7 h-7" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight truncate">Tampilan Orang Tua · {student.name}</h1>
          <p className="text-[13px] font-semibold text-ink-soft">
            NIS {student.nis} · Kelas {student.class_name} · Pratinjau hanya-lihat · tuntas ≥ {threshold}
          </p>
        </div>
      </div>

      <p className="text-xs font-semibold text-ink-soft bg-white border border-[rgba(30,39,50,0.08)] rounded-2xl px-4 py-3">
        Pratinjau staf: akun orang tua belum tersedia di sistem, jadi halaman ini hanya terbuka untuk staf yang login.
        Tugas dan agenda harian belum ditampilkan karena fitur tugas belum ada.
      </p>

      {semesters.map((block) => (
        <section
          key={block.semester.id}
          aria-label={`Nilai semester ${block.semester.label}`}
          className="bg-white rounded-[24px] border border-[rgba(30,39,50,0.08)] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[rgba(30,39,50,0.06)] flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-ink">Semester {block.semester.label}</h2>
            {block.semester.is_active && (
              <span className="px-2 py-0.5 rounded-full bg-hadir/10 text-hadir text-[10px] font-extrabold">
                Aktif
              </span>
            )}
          </div>
          {!block.grades || block.grades.length === 0 ? (
            <p className="px-5 py-6 text-xs text-ink-soft italic">Belum ada nilai pada semester ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-ink-soft font-bold uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3">Mata Pelajaran</th>
                    <th className="px-2 py-3 text-center">Tugas</th>
                    <th className="px-2 py-3 text-center">UTS</th>
                    <th className="px-2 py-3 text-center">Remedial</th>
                    <th className="px-2 py-3 text-center">UAS</th>
                    <th className="px-3 py-3 text-center">Nilai Akhir</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(30,39,50,0.06)] font-medium">
                  {block.grades.map((g) => (
                    <tr key={g.id}>
                      <td className="px-5 py-3 font-bold text-ink">{g.subject_name}</td>
                      <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.task_score)}</td>
                      <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.midterm_score)}</td>
                      <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.remedial_score)}</td>
                      <td className="px-2 py-3 text-center text-ink-soft">{fmtScore(g.final_score)}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-extrabold inline-block ${
                            g.passed === null || g.passed === undefined
                              ? 'bg-slate-50 text-ink-soft'
                              : g.passed
                                ? 'bg-hadir/10 text-hadir'
                                : 'bg-alpa/10 text-alpa'
                          }`}
                        >
                          {fmtScore(g.final_total)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-ink-soft font-semibold">
                        {STATUS_LABEL[g.status] || g.status || 'Draft'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
