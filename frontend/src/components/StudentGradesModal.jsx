import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, RefreshCw } from 'lucide-react';
import * as api from '../services/api';

// Ambang tuntas saat ini (KKTP bawaan sekolah). Nantinya angka ini dibaca
// dari pengaturan semester, bukan dikunci di kode.
const KKTP = 75;

const TYPE_LABELS = {
  tugas: 'Tugas',
  kuis: 'Kuis',
  ulangan: 'Ulangan',
  uts: 'Sumatif Tengah Semester',
  sts: 'Sumatif Tengah Semester',
  uas: 'Sumatif Akhir Semester',
  sas: 'Sumatif Akhir Semester',
  remedial: 'Remedial',
  ujian: 'Ujian',
};

function typeLabel(raw) {
  if (!raw) return 'Nilai';
  const key = String(raw).toLowerCase();
  return TYPE_LABELS[key] || raw;
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Popout Detail Nilai: jendela tersendiri, terpisah dari kartu siswa.
// Menampilkan SEMUA catatan nilai per mata pelajaran, dari tugas harian
// sampai ujian. Data yang sama kelak dilihat orang tua di dasbor mereka.
export default function StudentGradesModal({ student, onClose }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.getStudentGrades(student.id);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setGrades(list);
    } catch (e) {
      console.error('Failed fetching student grades', e);
      setError(true);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [student.id]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const grouped = useMemo(() => {
    const map = new Map();
    grades.forEach((g) => {
      const subject = g.subject_name || 'Mata Pelajaran';
      if (!map.has(subject)) map.set(subject, []);
      map.get(subject).push(g);
    });
    return [...map.entries()].map(([subject, items]) => {
      const nums = items.map((i) => parseFloat(i.grade)).filter((n) => !Number.isNaN(n));
      const avg = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
      return { subject, items, avg };
    });
  }, [grades]);

  const overallAvg = useMemo(() => {
    const nums = grades.map((g) => parseFloat(g.grade)).filter((n) => !Number.isNaN(n));
    return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
  }, [grades]);

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail nilai ${student.name}`}
    >
      <div className="absolute inset-0 bg-[#1E2732]/55 backdrop-blur-[3px] animate-backdrop-in" onClick={onClose} />

      <div className="relative w-full max-w-2xl animate-pop-in">
        <div className="bg-paper rounded-[28px] shadow-tile border border-[rgba(30,39,50,0.07)] max-h-[85vh] flex flex-col overflow-hidden">
          <header className="flex items-start justify-between gap-4 px-6 py-5 bg-white/85 backdrop-blur-xl backdrop-saturate-150 border-b border-[rgba(30,39,50,0.07)]">
            <div>
              <h2 className="text-lg font-extrabold text-ink leading-tight">Detail Nilai</h2>
              <p className="text-[13px] text-ink-soft font-semibold mt-0.5">
                {student.name} · {student.class_name} · NIS {student.nis}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail nilai"
              className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-full text-ink-soft hover:bg-marine/10 hover:text-marine-deep transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="overflow-y-auto p-5 space-y-4">
            <section aria-label="Ringkasan nilai" className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] shadow-tactile p-4">
                <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Catatan Nilai</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{loading ? '...' : grades.length}</p>
              </div>
              <div className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] shadow-tactile p-4">
                <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Rata-rata</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{loading ? '...' : overallAvg ?? '—'}</p>
              </div>
            </section>

            {loading && <p className="text-sm text-ink-soft text-center py-6">Memuat nilai...</p>}

            {!loading && error && (
              <div className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] p-5 text-center">
                <p className="text-sm font-semibold text-ink">Nilai belum bisa dimuat.</p>
                <p className="text-xs text-ink-soft mt-1">Periksa koneksi ke server, lalu coba lagi.</p>
                <button
                  type="button"
                  onClick={fetchGrades}
                  className="mt-3 h-11 px-5 rounded-full bg-marine/10 text-marine-deep text-sm font-bold inline-flex items-center gap-2 hover:bg-marine/15 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Coba Lagi
                </button>
              </div>
            )}

            {!loading && !error && grouped.length === 0 && (
              <p className="text-sm text-ink-soft text-center py-6">Belum ada nilai tercatat untuk siswa ini.</p>
            )}

            {!loading &&
              !error &&
              grouped.map(({ subject, items, avg }) => (
                <article
                  key={subject}
                  className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] shadow-tactile p-4"
                >
                  <header className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-sm font-extrabold text-ink">{subject}</h3>
                    {avg !== null && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          avg >= KKTP ? 'bg-hadir/10 text-hadir' : 'bg-alpa/10 text-alpa'
                        }`}
                      >
                        Rata-rata {avg}
                      </span>
                    )}
                  </header>
                  <ul className="divide-y divide-[rgba(30,39,50,0.06)]">
                    {items.map((g) => {
                      const score = parseFloat(g.grade);
                      const date = formatDate(g.created_at || g.date);
                      return (
                        <li key={g.id} className="py-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-ink">{typeLabel(g.grade_type)}</p>
                            {date && <p className="text-[11px] text-ink-soft">{date}</p>}
                          </div>
                          <span
                            className={`text-sm font-extrabold ${
                              !Number.isNaN(score) && score >= KKTP ? 'text-hadir' : 'text-alpa'
                            }`}
                          >
                            {g.grade}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}

            {!loading && !error && grouped.length > 0 && (
              <p className="text-[11px] text-ink-soft text-center px-2">
                Menampilkan semua nilai pada data saat ini. Pengelompokan per tahun ajaran dan semester
                mengikuti alur nilai baru yang sudah disepakati.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
