import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import * as api from '../services/api';

// Transkrip nilai siswa (hanya untuk melihat, tidak ada input di sini).
// Satu kartu per semester. Sistem nilai saat ini belum menyimpan semester
// secara eksplisit, jadi semester diturunkan dari tanggal nilai dimasukkan:
// Juli–Desember = Semester Ganjil, Januari–Juni = Semester Genap,
// mengikuti tahun ajaran Indonesia (mis. Ganjil 2026/2027).

const KKTP = 75; // batas tuntas yang sama dengan halaman Nilai

function periodOf(dateStr) {
  if (!dateStr) return { key: 'tanpa-tanggal', label: 'Belum Bertanggal', sort: Number.MAX_SAFE_INTEGER };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { key: 'tanpa-tanggal', label: 'Belum Bertanggal', sort: Number.MAX_SAFE_INTEGER };
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  if (m >= 7) return { key: `ganjil-${y}`, label: `Semester Ganjil ${y}/${y + 1}`, sort: y * 2 };
  return { key: `genap-${y - 1}`, label: `Semester Genap ${y - 1}/${y}`, sort: (y - 1) * 2 + 1 };
}

function rowFinal(row) {
  if (row.final_total !== null && row.final_total !== undefined) return Number(row.final_total);
  const parts = [row.task_score, row.midterm_score, row.remedial_score, row.final_score]
    .filter((v) => v !== null && v !== undefined)
    .map(Number);
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '–';
  return Number(v)
    .toFixed(2)
    .replace(/\.?0+$/, '');
}

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function StudentTranscriptPage({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [sRes, gRes] = await Promise.all([api.getStudent(id), api.getStudentGrades(id)]);
        if (!alive) return;
        setStudent(sRes.data);
        const list = Array.isArray(gRes.data) ? gRes.data : gRes.data?.data || [];
        setGrades(list);
      } catch (e) {
        if (alive) {
          setFailed(true);
          notify && notify('error', 'Gagal memuat transkrip nilai.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const semesters = useMemo(() => {
    const map = new Map();
    grades.forEach((row) => {
      const p = periodOf(row.created_at);
      if (!map.has(p.key)) map.set(p.key, { ...p, rows: [] });
      map.get(p.key).rows.push(row);
    });
    const list = Array.from(map.values()).sort((a, b) => a.sort - b.sort);
    list.forEach((sem) => {
      sem.rows.sort((a, b) => String(a.subject_name).localeCompare(String(b.subject_name)));
      sem.classes = [...new Set(sem.rows.map((r) => r.class_name).filter(Boolean))];
      const finals = sem.rows.map(rowFinal).filter((v) => v !== null);
      sem.average = finals.length ? finals.reduce((a, b) => a + b, 0) / finals.length : null;
    });
    return list;
  }, [grades]);

  const overall = useMemo(() => {
    const avgs = semesters.map((s) => s.average).filter((v) => v !== null);
    return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
  }, [semesters]);

  if (loading) {
    return <p className="text-sm text-ink-soft py-16 text-center">Memuat transkrip nilai...</p>;
  }

  if (failed || !student) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-bold text-ink">Transkrip tidak dapat dimuat.</p>
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

  return (
    <div className="animate-fade-in space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/students')}
          aria-label="Kembali ke Data Siswa"
          className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-full bg-white border border-[rgba(30,39,50,0.09)] text-ink hover:bg-marine/10 hover:text-marine-deep transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {student.photo_url ? (
          <img
            src={student.photo_url}
            alt={`Foto ${student.name}`}
            className="w-14 h-14 rounded-2xl object-cover border border-[rgba(30,39,50,0.08)]"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-tang/10 text-tang-dark flex items-center justify-center text-lg font-extrabold" aria-hidden="true">
            {initials(student.name)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight truncate">Transkrip Nilai · {student.name}</h1>
          <p className="text-[13px] font-semibold text-ink-soft">
            NIS {student.nis} · Kelas saat ini {student.class_name}
            {semesters.length > 0 && ` · ${semesters.length} semester tercatat`}
            {overall !== null && ` · Rata-rata keseluruhan ${fmt(overall)}`}
          </p>
        </div>
      </div>

      {semesters.length === 0 ? (
        <section className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile px-6 py-16 text-center">
          <BookOpen className="w-8 h-8 text-ink-soft/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink-soft">Belum ada nilai tercatat untuk siswa ini.</p>
        </section>
      ) : (
        semesters.map((sem) => (
          <section
            key={sem.key}
            aria-label={sem.label}
            className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile overflow-hidden"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[rgba(30,39,50,0.06)]">
              <div>
                <h2 className="text-sm font-extrabold text-ink">{sem.label}</h2>
                <p className="text-[11px] font-semibold text-ink-soft">
                  {sem.classes.length > 0 ? `Kelas ${sem.classes.join(', ')} · ` : ''}
                  {sem.rows.length} mata pelajaran
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold text-ink-soft uppercase tracking-widest">Rata-rata Semester</p>
                <p className={`text-2xl font-extrabold ${sem.average !== null && sem.average >= KKTP ? 'text-hadir' : 'text-tang-dark'}`}>
                  {fmt(sem.average)}
                </p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-[34%]">Mata Pelajaran</th>
                    <th className="px-4 py-3">Tugas</th>
                    <th className="px-4 py-3">STS</th>
                    <th className="px-4 py-3">SAS</th>
                    <th className="px-4 py-3">Remedial</th>
                    <th className="px-6 py-3 text-right">Nilai Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sem.rows.map((row) => {
                    const fin = rowFinal(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-900">{row.subject_name}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.task_score)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.midterm_score)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.final_score)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.remedial_score)}</td>
                        <td className={`px-6 py-3 text-right font-extrabold ${fin !== null && fin >= KKTP ? 'text-hadir' : 'text-alpa'}`}>
                          {fmt(fin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
