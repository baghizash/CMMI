import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Save, X, GraduationCap } from 'lucide-react';
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
    </div>
  );
}
