import React, { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, GraduationCap, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function StudentDetailDrawer({ student, onClose }) {
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [gradesError, setGradesError] = useState(false);
  const [showGrades, setShowGrades] = useState(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fetchGrades = async () => {
    setLoadingGrades(true);
    setGradesError(false);
    try {
      const res = await api.getStudentGrades(student.id);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setGrades(list);
    } catch (e) {
      console.error('Failed fetching student grades', e);
      setGradesError(true);
      setGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    fetchGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  // Kelompokkan semua catatan nilai per mata pelajaran, urutan kemunculan
  // pertama dipertahankan. Inilah data yang sama yang kelak dilihat orang
  // tua di dasbor mereka: semua nilai, dari tugas harian sampai ujian.
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Detail siswa ${student.name}`}>
      <div className="absolute inset-0 bg-[#1E2732]/45" onClick={onClose} />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-paper shadow-tile overflow-y-auto animate-fade-in">
        {/* Panel header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/85 backdrop-blur-xl backdrop-saturate-150 border-b border-[rgba(30,39,50,0.07)]">
          <h2 className="text-base font-extrabold text-ink">Detail Siswa</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail siswa"
            className="w-11 h-11 inline-flex items-center justify-center rounded-full text-ink-soft hover:bg-marine/10 hover:text-marine-deep transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Kartu identitas siswa, meniru bentuk KTP: foto kiri, data
              tengah, QR besar di kanan. QR yang sama dipakai untuk absensi. */}
          <section aria-label="Kartu identitas siswa" className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] shadow-tactile overflow-hidden">
            <div className="bg-marine px-5 py-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-white text-xs font-extrabold tracking-widest uppercase">
                <GraduationCap className="w-4 h-4" /> Kartu Siswa
              </span>
              <span className="text-white/85 text-[11px] font-bold">CMMI Absensi</span>
            </div>

            <div className="p-5 flex gap-4">
              {/* Foto */}
              <div className="shrink-0">
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={`Foto ${student.name}`}
                    className="w-[76px] h-[96px] object-cover rounded-2xl border border-[rgba(30,39,50,0.08)]"
                  />
                ) : (
                  <div className="w-[76px] h-[96px] rounded-2xl bg-marine/10 text-marine-deep flex items-center justify-center text-xl font-extrabold" aria-hidden="true">
                    {initials(student.name)}
                  </div>
                )}
              </div>

              {/* Data */}
              <dl className="flex-1 min-w-0 space-y-2 text-[13px]">
                <div>
                  <dt className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Nama</dt>
                  <dd className="font-extrabold text-ink leading-snug">{student.name}</dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">NIS</dt>
                    <dd className="font-bold text-ink font-mono">{student.nis}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Kelas</dt>
                    <dd className="font-bold text-ink">{student.class_name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Jenis Kelamin</dt>
                    <dd className="font-bold text-ink">{student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Status</dt>
                    <dd>
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-hadir/10 text-hadir text-[11px] font-extrabold">Aktif</span>
                    </dd>
                  </div>
                </div>
              </dl>

              {/* QR */}
              <div className="shrink-0 text-center">
                <div className="p-2 bg-white border border-[rgba(30,39,50,0.1)] rounded-2xl shadow-soft inline-block">
                  <QRCodeSVG value={student.qr_code || student.nis} size={86} level="H" />
                </div>
                <p className="mt-1.5 text-[11px] font-mono font-bold text-ink">{student.nis}</p>
                <p className="text-[10px] font-mono text-ink-soft break-all max-w-[100px]">{student.qr_code}</p>
              </div>
            </div>
          </section>

          {/* Ringkasan nilai */}
          <section aria-label="Ringkasan nilai" className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] shadow-tactile p-4">
              <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Catatan Nilai</p>
              <p className="mt-1 text-2xl font-extrabold text-ink">{loadingGrades ? '...' : grades.length}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] shadow-tactile p-4">
              <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Rata-rata</p>
              <p className="mt-1 text-2xl font-extrabold text-ink">{loadingGrades ? '...' : overallAvg ?? '—'}</p>
            </div>
          </section>

          <button
            type="button"
            onClick={() => setShowGrades((v) => !v)}
            aria-expanded={showGrades}
            className="w-full h-11 rounded-full bg-marine text-white text-sm font-bold shadow-tactile hover:bg-marine-deep active:shadow-tactile-pressed transition-all inline-flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            {showGrades ? 'Sembunyikan Detail Nilai' : 'Detail Nilai'}
          </button>

          {/* Detail nilai: semua catatan per mata pelajaran */}
          {showGrades && (
            <section aria-label="Detail nilai siswa" className="space-y-3">
              {loadingGrades && (
                <p className="text-sm text-ink-soft text-center py-6">Memuat nilai...</p>
              )}

              {!loadingGrades && gradesError && (
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

              {!loadingGrades && !gradesError && grouped.length === 0 && (
                <p className="text-sm text-ink-soft text-center py-6">Belum ada nilai tercatat untuk siswa ini.</p>
              )}

              {!loadingGrades &&
                !gradesError &&
                grouped.map(({ subject, items, avg }) => (
                  <article key={subject} className="bg-white rounded-3xl border border-[rgba(30,39,50,0.07)] shadow-tactile p-4">
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

              {!loadingGrades && !gradesError && grouped.length > 0 && (
                <p className="text-[11px] text-ink-soft text-center px-2">
                  Menampilkan semua nilai pada data saat ini. Pengelompokan per tahun ajaran dan semester
                  mengikuti alur nilai baru yang sudah disepakati.
                </p>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
