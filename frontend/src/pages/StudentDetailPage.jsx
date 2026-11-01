import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Save, X, GraduationCap, BookOpen } from 'lucide-react';
import * as api from '../services/api';
import { CLASSES } from '../constants';

// Halaman detail siswa yang sebenarnya (terpisah dari popout kartu cepat
// di Data Siswa). Isinya SATU kartu data diri lengkap yang dapat diubah
// oleh admin (dan kepsek / guru piket, mengikuti izin update di backend).

const EDIT_ROLES = ['admin', 'kepsek'];

const RELIGIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];

const SECTIONS = [
  {
    title: 'Identitas Siswa',
    fields: [
      { key: 'name', label: 'Nama Lengkap' },
      { key: 'nis', label: 'NIS' },
      { key: 'nisn', label: 'NISN' },
      { key: 'nik', label: 'NIK' },
      { key: 'no_kk', label: 'Nomor KK' },
      { key: 'birth_place', label: 'Tempat Lahir' },
      { key: 'birth_date', label: 'Tanggal Lahir', type: 'date' },
      { key: 'gender', label: 'Jenis Kelamin', type: 'select', options: [['L', 'Laki-laki'], ['P', 'Perempuan']] },
      { key: 'religion', label: 'Agama', type: 'select', options: RELIGIONS.map((r) => [r, r]) },
      { key: 'child_order', label: 'Anak Ke', type: 'number' },
      { key: 'siblings_count', label: 'Jumlah Saudara', type: 'number' },
      { key: 'address', label: 'Alamat Lengkap', type: 'textarea', wide: true },
    ],
  },
  {
    title: 'Data Akademik',
    fields: [
      { key: 'class_name', label: 'Kelas', type: 'select', options: CLASSES.map((c) => [c, c]) },
      { key: 'enrollment_year', label: 'Tahun Masuk', placeholder: 'Contoh: 2024' },
      { key: 'previous_school', label: 'Asal Sekolah' },
    ],
  },
  {
    title: 'Orang Tua dan Wali',
    fields: [
      { key: 'father_name', label: 'Nama Ayah' },
      { key: 'father_job', label: 'Pekerjaan Ayah' },
      { key: 'mother_name', label: 'Nama Ibu' },
      { key: 'mother_job', label: 'Pekerjaan Ibu' },
      { key: 'guardian_name', label: 'Nama Wali (bila ada)' },
      { key: 'parent_phone', label: 'No. HP Orang Tua / Wali', placeholder: '08xxxxxxxxxx' },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

function displayValue(student, field) {
  const v = student[field.key];
  if (v === null || v === undefined || v === '') return null;
  if (field.type === 'select') {
    const found = field.options.find(([val]) => String(val) === String(v));
    return found ? found[1] : String(v);
  }
  if (field.type === 'date') {
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? String(v)
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return String(v);
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

const inputCls =
  'w-full h-11 px-3.5 rounded-2xl bg-[#F4F1EA] border border-[rgba(30,39,50,0.09)] text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-marine/50 focus:bg-white transition';

// Pilihan tingkat kelas SD dan semester untuk seksi nilai di halaman ini.
const LEVELS = [1, 2, 3, 4, 5, 6];
const TERMS = ['Ganjil', 'Genap'];

// Samakan label dan warna badge status batch dengan halaman nilai.
const GRADE_STATUS_META = {
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-600' },
  submitted: { label: 'Terkirim', cls: 'bg-sky-100 text-sky-800' },
  verified: { label: 'Terverifikasi', cls: 'bg-violet-100 text-violet-800' },
  locked: { label: 'Terkunci', cls: 'bg-emerald-100 text-emerald-800' },
};

// Tingkat kelas dari nama kelas, mis. "1A" menjadi 1.
function levelOf(className) {
  const m = String(className || '').match(/^\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function fmtScore(v) {
  if (v === null || v === undefined || v === '') return '\u2014';
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : String(n);
}

export default function StudentDetailPage({ user, notify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const canEdit = EDIT_ROLES.includes(user?.role);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.getStudent(id);
        if (alive) setStudent(res.data);
      } catch (e) {
        if (alive) {
          if (e.response?.status === 404) setNotFound(true);
          else notify && notify('error', 'Gagal memuat detail siswa.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // ---- Nilai per kelas dan semester -------------------------------------
  const [grades, setGrades] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [selLevel, setSelLevel] = useState(null);
  const [selTerm, setSelTerm] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setGradesLoading(true);
      try {
        const res = await api.getStudentGrades(id);
        if (alive) setGrades(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (alive) setGrades([]);
      }
      try {
        const res = await api.getSemesters();
        const list = res.data?.data ?? res.data;
        if (alive) setSemesters(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setSemesters([]);
      } finally {
        if (alive) setGradesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const semesterById = useMemo(() => {
    const map = {};
    semesters.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [semesters]);

  const activeTerm = useMemo(() => {
    const active = semesters.find((s) => s.is_active);
    return active && TERMS.includes(active.name) ? active.name : 'Ganjil';
  }, [semesters]);

  // Tingkat kelas siswa saat ini; tingkat di atasnya tidak bisa dipilih.
  const currentLevel = useMemo(() => {
    const parsed = levelOf(student?.class_name);
    if (parsed) return parsed;
    const fromGrades = grades.map((g) => levelOf(g.class_name)).filter(Boolean);
    return fromGrades.length ? Math.max(...fromGrades) : LEVELS[LEVELS.length - 1];
  }, [student, grades]);

  // Pilihan awal: kelas siswa saat ini dan semester yang sedang aktif.
  useEffect(() => {
    if (!student || selLevel !== null) return;
    const parsed = levelOf(student.class_name);
    if (parsed) setSelLevel(parsed);
    if (!selTerm) setSelTerm(activeTerm);
  }, [student, semesters, selLevel, selTerm, activeTerm]);

  const selectLevel = (lvl) => {
    setSelLevel(lvl);
    if (!selTerm) setSelTerm(activeTerm);
  };

  // Nilai untuk tingkat + semester terpilih. Bila satu tingkat dan
  // semester cocok dengan dua tahun ajaran (siswa tinggal kelas), yang
  // ditampilkan tahun ajaran paling baru.
  const gradeView = useMemo(() => {
    const empty = { rows: [], year: null, className: null };
    if (!selLevel || !selTerm) return empty;
    const matched = grades.filter((g) => {
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
    return { rows, year: top.year || null, className: rows[0]?.class_name || null };
  }, [grades, semesterById, selLevel, selTerm]);

  const startEdit = () => {
    const f = {};
    ALL_FIELDS.forEach(({ key }) => {
      f[key] = student[key] ?? '';
    });
    setForm(f);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      ALL_FIELDS.forEach(({ key, type }) => {
        let v = form[key];
        if (typeof v === 'string') v = v.trim();
        if (v === '') v = null;
        if (type === 'number' && v !== null) v = Number(v);
        payload[key] = v;
      });
      const res = await api.updateStudent(id, payload);
      setStudent(res.data);
      setEditing(false);
      notify && notify('success', 'Data diri siswa berhasil disimpan.');
    } catch (e) {
      notify && notify('error', e.response?.data?.message || 'Gagal menyimpan data siswa.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-soft py-16 text-center">Memuat detail siswa...</p>;
  }

  if (notFound || !student) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-bold text-ink">Siswa tidak ditemukan.</p>
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
          <div className="w-14 h-14 rounded-2xl bg-marine/10 text-marine-deep flex items-center justify-center text-lg font-extrabold" aria-hidden="true">
            {initials(student.name)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight truncate">{student.name}</h1>
          <p className="text-[13px] font-semibold text-ink-soft">
            NIS {student.nis} · {student.class_name} · {student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
          </p>
        </div>
      </div>

      {/* The one editable biodata card */}
      <section aria-label="Data diri siswa" className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[rgba(30,39,50,0.06)]">
          <h2 className="inline-flex items-center gap-2 text-sm font-extrabold text-ink">
            <GraduationCap className="w-4 h-4 text-marine" /> Data Diri Siswa
          </h2>
          {canEdit && !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="h-11 px-5 rounded-full bg-marine text-white text-sm font-bold shadow-tactile hover:bg-marine-deep active:shadow-tactile-pressed transition-all inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Ubah Data
            </button>
          )}
          {canEdit && editing && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="h-11 px-5 rounded-full border border-[rgba(30,39,50,0.12)] text-sm font-bold text-ink hover:bg-marine/5 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-11 px-5 rounded-full bg-marine text-white text-sm font-bold shadow-tactile hover:bg-marine-deep active:shadow-tactile-pressed transition-all inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          )}
        </header>

        <div className="px-6 py-5 space-y-7">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-extrabold text-ink-soft uppercase tracking-widest mb-3">{section.title}</h3>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {section.fields.map((field) => (
                  <div key={field.key} className={field.wide ? 'sm:col-span-2' : ''}>
                    <label htmlFor={editing ? `f-${field.key}` : undefined} className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">
                      {field.label}
                    </label>
                    {!editing ? (
                      <p className="text-sm font-semibold text-ink min-h-6">
                        {displayValue(student, field) ?? <span className="text-ink-soft/70 italic font-medium">Belum diisi</span>}
                      </p>
                    ) : field.type === 'select' ? (
                      <select
                        id={`f-${field.key}`}
                        value={form[field.key] ?? ''}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">Belum diisi</option>
                        {field.options.map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        id={`f-${field.key}`}
                        value={form[field.key] ?? ''}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        rows={3}
                        className={`${inputCls} h-auto py-3 resize-y`}
                      />
                    ) : (
                      <input
                        id={`f-${field.key}`}
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                        value={form[field.key] ?? ''}
                        placeholder={field.placeholder}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        className={inputCls}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nilai per kelas dan semester */}
      <section aria-label="Nilai siswa per kelas dan semester" className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile overflow-hidden">
        <header className="px-6 py-4 border-b border-[rgba(30,39,50,0.06)]">
          <h2 className="inline-flex items-center gap-2 text-sm font-extrabold text-ink">
            <BookOpen className="w-4 h-4 text-marine" /> Nilai per Kelas dan Semester
          </h2>
          <p className="text-xs font-semibold text-ink-soft mt-1">
            Pilih kelas, lalu pilih semester ganjil atau genap untuk melihat nilainya. Kelas di atas kelas siswa saat ini belum bisa dibuka.
          </p>
        </header>

        <div className="px-6 py-5 space-y-4">
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

          {gradesLoading ? (
            <p className="text-sm font-semibold text-ink-soft">Memuat nilai...</p>
          ) : gradeView.rows.length ? (
            <div>
              <p className="text-[13px] font-bold text-ink">
                Kelas {selLevel} · Semester {selTerm}
                {gradeView.year ? ` · Tahun Ajaran ${gradeView.year}` : ''}
                {gradeView.className ? ` · ${gradeView.className}` : ''}
              </p>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-ink-soft border-b border-[rgba(30,39,50,0.08)]">
                      <th className="py-2 pr-3">Mata Pelajaran</th>
                      <th className="py-2 px-2 text-center">Tugas</th>
                      <th className="py-2 px-2 text-center">UTS</th>
                      <th className="py-2 px-2 text-center">Remedial</th>
                      <th className="py-2 px-2 text-center">UAS</th>
                      <th className="py-2 px-2 text-center">Nilai Akhir</th>
                      <th className="py-2 pl-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeView.rows.map((g) => (
                      <tr key={g.id} className="border-b border-[rgba(30,39,50,0.05)] last:border-0">
                        <td className="py-2.5 pr-3 font-semibold text-ink">{g.subject_name}</td>
                        <td className="py-2.5 px-2 text-center font-semibold text-ink">{fmtScore(g.task_score)}</td>
                        <td className="py-2.5 px-2 text-center font-semibold text-ink">{fmtScore(g.midterm_score)}</td>
                        <td className="py-2.5 px-2 text-center font-semibold text-ink">{fmtScore(g.remedial_score)}</td>
                        <td className="py-2.5 px-2 text-center font-semibold text-ink">{fmtScore(g.final_score)}</td>
                        <td className="py-2.5 px-2 text-center font-extrabold text-ink">{fmtScore(g.final_total)}</td>
                        <td className="py-2.5 pl-2 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${(GRADE_STATUS_META[g.status] || GRADE_STATUS_META.draft).cls}`}>
                            {(GRADE_STATUS_META[g.status] || GRADE_STATUS_META.draft).label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : selLevel && selTerm ? (
            <p className="text-sm font-semibold text-ink-soft">
              Belum ada nilai untuk Kelas {selLevel} Semester {selTerm}.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
