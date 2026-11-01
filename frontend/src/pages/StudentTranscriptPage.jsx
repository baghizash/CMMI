import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ClipboardList } from 'lucide-react';
import * as api from '../services/api';

// Transkrip nilai siswa (hanya untuk melihat, tidak ada input di sini).
// Nilai ditampilkan SATU tempat lewat pemilih kelas x semester: pill
// Kelas 1-6, kelas terpilih melebar memunculkan pilihan Ganjil/Genap,
// dan tabel di bawahnya mengikuti pilihan itu. Di bawah nilai ada garis
// penuh lalu ringkasan Absensi semester terpilih (sakit, izin, alpa)
// beserta keputusan naik/tinggal/lulus dari wali kelas (arsip) bila ada.

const KKTP = 75; // batas tuntas yang sama dengan halaman Nilai

// Pilihan tingkat kelas SD dan semester untuk pemilih nilai.
const LEVELS = [1, 2, 3, 4, 5, 6];
const TERMS = ['Ganjil', 'Genap'];

// Samakan label dan warna badge status batch dengan halaman nilai.
const STATUS_META = {
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-600' },
  submitted: { label: 'Terkirim', cls: 'bg-sky-100 text-sky-800' },
  verified: { label: 'Terverifikasi', cls: 'bg-violet-100 text-violet-800' },
  locked: { label: 'Terkunci', cls: 'bg-emerald-100 text-emerald-800' },
};

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

// Tingkat kelas dari nama kelas, mis. "1A" menjadi 1.
function levelOf(className) {
  const m = String(className || '').match(/^\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function nextClassOf(className) {
  const m = /^([1-6])([AB])$/.exec(className || '');
  if (!m) return null;
  const grade = Number(m[1]);
  return grade >= 6 ? null : `${grade + 1}${m[2]}`;
}

function decisionBadge(decision) {
  if (!decision) return null;
  if (decision.decision === 'lulus') {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full bg-plum/10 text-plum text-[11px] font-extrabold">
        Lulus · Menjadi Alumni
      </span>
    );
  }
  if (decision.decision === 'naik') {
    const next = nextClassOf(decision.class_name);
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full bg-hadir/10 text-hadir text-[11px] font-extrabold">
        Naik{next ? ` ke Kelas ${next}` : ' Kelas'}
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full bg-telat/10 text-telat text-[11px] font-extrabold">
      Tinggal di Kelas {decision.class_name}
    </span>
  );
}

export default function StudentTranscriptPage({ notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [overall, setOverall] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selLevel, setSelLevel] = useState(null);
  const [selTerm, setSelTerm] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.getStudentTranscript(id);
        if (!alive) return;
        setStudent(res.data.student);
        setBlocks(Array.isArray(res.data.semesters) ? res.data.semesters : []);
        setOverall(res.data.overall_average ?? null);
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

  // Daftar semester untuk menentukan semester yang sedang aktif
  // (pilihan awal pemilih). Kegagalan di sini tidak menggagalkan halaman.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.getSemesters();
        const list = res.data?.data ?? res.data;
        if (alive) setSemesters(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setSemesters([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Semua baris nilai dari semua blok semester, diratakan.
  const allGrades = useMemo(
    () => blocks.flatMap((b) => (Array.isArray(b.grades) ? b.grades : [])),
    [blocks]
  );

  const semesterById = useMemo(() => {
    const map = {};
    blocks.forEach((b) => {
      if (b.semester?.id) map[b.semester.id] = b.semester;
    });
    semesters.forEach((s) => {
      if (s?.id && !map[s.id]) map[s.id] = s;
    });
    return map;
  }, [blocks, semesters]);

  const blockBySemesterId = useMemo(() => {
    const map = {};
    blocks.forEach((b) => {
      if (b.semester?.id) map[b.semester.id] = b;
    });
    return map;
  }, [blocks]);

  const activeTerm = useMemo(() => {
    const active =
      semesters.find((s) => s.is_active) ||
      blocks.map((b) => b.semester).find((s) => s && s.is_active);
    return active && TERMS.includes(active.name) ? active.name : 'Ganjil';
  }, [semesters, blocks]);

  // Tingkat kelas siswa saat ini; tingkat di atasnya tidak bisa dipilih.
  const currentLevel = useMemo(() => {
    const parsed = levelOf(student?.class_name);
    if (parsed) return parsed;
    const fromGrades = allGrades.map((g) => levelOf(g.class_name)).filter(Boolean);
    return fromGrades.length ? Math.max(...fromGrades) : LEVELS[LEVELS.length - 1];
  }, [student, allGrades]);

  // Pilihan awal: kelas siswa saat ini dan semester yang sedang aktif.
  useEffect(() => {
    if (!student || selLevel !== null) return;
    const parsed = levelOf(student.class_name);
    if (parsed) setSelLevel(parsed);
    if (!selTerm) setSelTerm(activeTerm);
  }, [student, selLevel, selTerm, activeTerm]);

  const selectLevel = (lvl) => {
    setSelLevel(lvl);
    if (!selTerm) setSelTerm(activeTerm);
  };

  // Nilai untuk tingkat + semester terpilih. Bila satu tingkat dan
  // semester cocok dengan dua tahun ajaran (siswa tinggal kelas), yang
  // ditampilkan tahun ajaran paling baru, lengkap dengan blok sumbernya
  // (keputusan wali kelas dan absensi ikut blok itu).
  const gradeView = useMemo(() => {
    const empty = { rows: [], year: null, className: null, block: null, average: null };
    if (!selLevel || !selTerm) return empty;
    const matched = allGrades.filter((g) => {
      if (levelOf(g.class_name) !== selLevel) return false;
      const sem = semesterById[g.semester_id];
      return sem && sem.name === selTerm;
    });
    if (!matched.length) return empty;
    const byYear = {};
    matched.forEach((g) => {
      const sem = semesterById[g.semester_id];
      const key = sem.academic_year || '';
      if (!byYear[key]) byYear[key] = { year: key, start: sem.start_date || '', rows: [] };
      byYear[key].rows.push(g);
    });
    const groups = Object.values(byYear).sort((a, b) => (a.start < b.start ? 1 : -1));
    const top = groups[0];
    const rows = [...top.rows].sort((a, b) => String(a.subject_name).localeCompare(String(b.subject_name)));
    const finals = rows.map(rowFinal).filter((v) => v !== null);
    const average = finals.length ? finals.reduce((a, b) => a + b, 0) / finals.length : null;
    return {
      rows,
      year: top.year || null,
      className: rows[0]?.class_name || null,
      block: blockBySemesterId[rows[0]?.semester_id] || null,
      average,
    };
  }, [allGrades, semesterById, blockBySemesterId, selLevel, selTerm]);

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

  const selBlock = gradeView.block;
  const att = selBlock?.attendance || { sakit: 0, izin: 0, alpa: 0 };

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
            {student.status === 'alumni' && ' · Alumni'}
            {blocks.length > 0 && ` · ${blocks.length} semester tercatat`}
            {overall !== null && ` · Rata-rata keseluruhan ${fmt(overall)}`}
          </p>
        </div>
      </div>

      {blocks.length === 0 ? (
        <section className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile px-6 py-16 text-center">
          <BookOpen className="w-8 h-8 text-ink-soft/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink-soft">Belum ada nilai tercatat untuk siswa ini.</p>
        </section>
      ) : (
        <section
          aria-label="Nilai per kelas dan semester"
          className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile overflow-hidden"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[rgba(30,39,50,0.06)]">
            <div>
              <h2 className="text-sm font-extrabold text-ink">
                Semester {selTerm || ''}
                {gradeView.year ? ` ${gradeView.year}` : ''}
              </h2>
              <p className="text-[11px] font-semibold text-ink-soft">
                {gradeView.className ? `Kelas ${gradeView.className} · ` : selLevel ? `Kelas ${selLevel} · ` : ''}
                {gradeView.rows.length} mata pelajaran
              </p>
              {selBlock?.decision && <div className="mt-2">{decisionBadge(selBlock.decision)}</div>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-ink-soft uppercase tracking-widest">Rata-rata Semester</p>
              <p className={`text-2xl font-extrabold ${gradeView.average !== null && gradeView.average >= KKTP ? 'text-hadir' : 'text-tang-dark'}`}>
                {fmt(gradeView.average)}
              </p>
            </div>
          </header>

          {selBlock?.decision && selBlock.decision.reason && (
            <p className="px-6 py-2.5 bg-slate-50/70 border-b border-[rgba(30,39,50,0.06)] text-[11px] font-semibold text-slate-500">
              Keputusan wali kelas{selBlock.decision.decided_by_name ? ` (${selBlock.decision.decided_by_name})` : ''}: {selBlock.decision.reason}
            </p>
          )}

          <div className="px-6 py-5">
            <div className="flex flex-wrap items-center gap-1.5 rounded-[26px] bg-[#EDF0F4] p-1.5" role="group" aria-label="Pilih kelas dan semester">
              {LEVELS.map((lvl) => {
                if (lvl > currentLevel) {
                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled
                      aria-disabled="true"
                      title={`Kelas ${lvl} belum ditempuh`}
                      className="h-10 px-4 rounded-full text-sm font-bold text-slate-400 cursor-not-allowed opacity-60"
                    >
                      Kelas {lvl}
                    </button>
                  );
                }
                if (lvl !== selLevel) {
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => selectLevel(lvl)}
                      className="h-10 px-4 rounded-full text-sm font-bold text-ink-soft hover:text-ink transition-colors"
                    >
                      Kelas {lvl}
                    </button>
                  );
                }
                return (
                  <div key={lvl} className="flex grow items-center gap-1 rounded-full bg-white p-1 shadow-sm transition-all duration-300">
                    <span className="inline-flex h-9 items-center px-4 rounded-full bg-marine text-white text-sm font-bold whitespace-nowrap">
                      Kelas {lvl}
                    </span>
                    {TERMS.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSelTerm(term)}
                        aria-pressed={selTerm === term}
                        className={
                          selTerm === term
                            ? 'h-9 px-4 rounded-full bg-marine-deep text-white text-sm font-bold transition-colors'
                            : 'h-9 px-4 rounded-full text-sm font-bold text-ink-soft hover:text-ink transition-colors'
                        }
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {gradeView.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-[30%]">Mata Pelajaran</th>
                    <th className="px-4 py-3">Tugas</th>
                    <th className="px-4 py-3">STS</th>
                    <th className="px-4 py-3">SAS</th>
                    <th className="px-4 py-3">Remedial</th>
                    <th className="px-4 py-3 text-right">Nilai Akhir</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {gradeView.rows.map((row) => {
                    const fin = rowFinal(row);
                    const meta = STATUS_META[row.status] || STATUS_META.draft;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-900">{row.subject_name}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.task_score)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.midterm_score)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.final_score)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(row.remedial_score)}</td>
                        <td className={`px-4 py-3 text-right font-extrabold ${fin !== null && fin >= KKTP ? 'text-hadir' : 'text-alpa'}`}>
                          {fmt(fin)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : selLevel && selTerm ? (
            <p className="px-6 pb-5 text-sm font-semibold text-ink-soft">
              Belum ada nilai untuk Kelas {selLevel} Semester {selTerm}.
            </p>
          ) : null}

          {/* Absensi semester terpilih: garis penuh lalu ringkasan sakit/izin/alpa */}
          {selBlock && (
            <div className="border-t-2 border-[rgba(30,39,50,0.09)] px-6 py-4">
              <h3 className="text-xs font-extrabold text-ink flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-piket" /> Absensi
              </h3>
              <div className="flex flex-wrap gap-x-8 gap-y-1 mt-2 text-xs font-semibold text-slate-600">
                <span>Sakit <strong className="text-slate-900 font-extrabold">{att.sakit} hari</strong></span>
                <span>Izin <strong className="text-slate-900 font-extrabold">{att.izin} hari</strong></span>
                <span>Alpa <strong className="text-slate-900 font-extrabold">{att.alpa} hari</strong></span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
