import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ClipboardList, Users } from 'lucide-react';
import * as api from '../services/api';

// Transkrip nilai siswa (hanya untuk melihat, tidak ada input di sini).
// Satu kartu per semester ASLI dari tabel semesters: nilai per mapel,
// keputusan naik/tinggal/lulus dari wali kelas (arsip), dan di bawah
// nilai sebuah garis penuh lalu ringkasan Absensi semester itu
// (sakit, izin, alpa).

const KKTP = 75; // batas tuntas yang sama dengan halaman Nilai

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
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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
            {student.status === 'alumni' && ' · Alumni'}
            {blocks.length > 0 && ` · ${blocks.length} semester tercatat`}
            {overall !== null && ` · Rata-rata keseluruhan ${fmt(overall)}`}
          </p>
        </div>
        <Link
          to={`/orang-tua/${student.id}`}
          className="ml-auto h-10 px-4 rounded-full bg-plum/10 hover:bg-plum/15 text-plum text-xs font-bold inline-flex items-center gap-2 transition-colors"
        >
          <Users className="w-4 h-4" /> Tampilan Orang Tua
        </Link>
      </div>

      {blocks.length === 0 ? (
        <section className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile px-6 py-16 text-center">
          <BookOpen className="w-8 h-8 text-ink-soft/50 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink-soft">Belum ada nilai tercatat untuk siswa ini.</p>
        </section>
      ) : (
        blocks.map((block) => {
          const rows = [...(block.grades || [])].sort((a, b) => String(a.subject_name).localeCompare(String(b.subject_name)));
          const finals = rows.map(rowFinal).filter((v) => v !== null);
          const average = finals.length ? finals.reduce((a, b) => a + b, 0) / finals.length : null;
          const classNames = [...new Set(rows.map((r) => r.class_name).filter(Boolean))];
          if (block.decision && block.decision.class_name && !classNames.includes(block.decision.class_name)) {
            classNames.push(block.decision.class_name);
          }
          const att = block.attendance || { sakit: 0, izin: 0, alpa: 0 };
          return (
            <section
              key={block.semester.id}
              aria-label={`Semester ${block.semester.label}`}
              className="bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tactile overflow-hidden"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[rgba(30,39,50,0.06)]">
                <div>
                  <h2 className="text-sm font-extrabold text-ink">Semester {block.semester.label}</h2>
                  <p className="text-[11px] font-semibold text-ink-soft">
                    {classNames.length > 0 ? `Kelas ${classNames.join(', ')} · ` : ''}
                    {rows.length} mata pelajaran
                  </p>
                  {block.decision && <div className="mt-2">{decisionBadge(block.decision)}</div>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-extrabold text-ink-soft uppercase tracking-widest">Rata-rata Semester</p>
                  <p className={`text-2xl font-extrabold ${average !== null && average >= KKTP ? 'text-hadir' : 'text-tang-dark'}`}>
                    {fmt(average)}
                  </p>
                </div>
              </header>

              {block.decision && block.decision.reason && (
                <p className="px-6 py-2.5 bg-slate-50/70 border-b border-[rgba(30,39,50,0.06)] text-[11px] font-semibold text-slate-500">
                  Keputusan wali kelas{block.decision.decided_by_name ? ` (${block.decision.decided_by_name})` : ''}: {block.decision.reason}
                </p>
              )}

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
                    {rows.map((row) => {
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

              {/* Absensi semester ini: garis penuh lalu ringkasan sakit/izin/alpa */}
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
            </section>
          );
        })
      )}
    </div>
  );
}
