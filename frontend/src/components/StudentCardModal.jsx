import React, { useEffect } from 'react';
import { X, GraduationCap, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// Popout kartu identitas siswa: muncul halus di tengah layar, latar
// belakang tertutup. Isinya HANYA kartu (sesuai keputusan desain):
// foto kiri, data tengah, QR siswa besar di kanan.
export default function StudentCardModal({ student, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Kartu siswa ${student.name}`}
    >
      <div className="absolute inset-0 bg-[#1E2732]/55 backdrop-blur-[3px] animate-backdrop-in" onClick={onClose} />

      <div className="relative w-full max-w-[580px] animate-pop-in">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup kartu siswa"
          className="absolute -top-3 -right-3 z-10 w-11 h-11 inline-flex items-center justify-center rounded-full bg-white text-ink shadow-tile hover:text-alpa transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <section
          aria-label="Kartu identitas siswa"
          className="cmmi-print-area bg-white rounded-[28px] border border-[rgba(30,39,50,0.07)] shadow-tile overflow-hidden"
        >
          <div className="bg-marine px-6 py-3.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-white text-xs font-extrabold tracking-widest uppercase">
              <GraduationCap className="w-4 h-4" /> Kartu Siswa
            </span>
            <span className="text-white/85 text-[11px] font-bold">CMMI Absensi</span>
          </div>

          <div className="p-6 flex gap-5">
            {/* Foto */}
            <div className="shrink-0">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={`Foto ${student.name}`}
                  className="w-[92px] h-[116px] object-cover rounded-2xl border border-[rgba(30,39,50,0.08)]"
                />
              ) : (
                <div
                  className="w-[92px] h-[116px] rounded-2xl bg-marine/10 text-marine-deep flex items-center justify-center text-2xl font-extrabold"
                  aria-hidden="true"
                >
                  {initials(student.name)}
                </div>
              )}
            </div>

            {/* Data */}
            <dl className="flex-1 min-w-0 space-y-2.5 text-sm">
              <div>
                <dt className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Nama</dt>
                <dd className="font-extrabold text-ink leading-snug text-base">{student.name}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
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
                    {student.status === 'alumni' ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-plum/10 text-plum text-[11px] font-extrabold">
                        Alumni
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-hadir/10 text-hadir text-[11px] font-extrabold">
                        Aktif
                      </span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>

            {/* QR: kode yang sama dipakai untuk absensi */}
            <div className="shrink-0 text-center">
              <div className="p-2 bg-white border border-[rgba(30,39,50,0.1)] rounded-2xl shadow-soft inline-block">
                <QRCodeSVG value={student.qr_code || student.nis} size={104} level="H" />
              </div>
              <p className="mt-1.5 text-xs font-mono font-bold text-ink">{student.nis}</p>
              <p className="text-[10px] font-mono text-ink-soft break-all max-w-[118px]">{student.qr_code}</p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex justify-center print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-11 px-5 rounded-full bg-marine text-white text-sm font-bold shadow-tactile hover:bg-marine-deep active:shadow-tactile-pressed transition-all inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak Kartu
          </button>
        </div>
      </div>
    </div>
  );
}
