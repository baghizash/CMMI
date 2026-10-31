import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Bilah pagination bersama untuk semua tabel: keterangan rentang data,
// tombol Sebelumnya/Berikutnya, dan nomor halaman. Halaman aktif marine.
export default function PaginationBar({ page, totalPages, total, perPage, onPageChange }) {
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pageNumbers = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pageNumbers.push(i);
  } else {
    const window = [page - 1, page, page + 1].filter((n) => n > 1 && n < totalPages);
    pageNumbers.push(1);
    if (window.length && window[0] > 2) pageNumbers.push('...');
    pageNumbers.push(...window);
    if (window.length && window[window.length - 1] < totalPages - 1) pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }

  const btnBase =
    'min-w-11 h-11 px-3 inline-flex items-center justify-center rounded-full text-[13px] font-bold transition-all';

  return (
    <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs font-semibold text-ink-soft" aria-live="polite">
        Menampilkan {from}–{to} dari {total} data
      </p>
      <nav className="flex items-center gap-1.5" aria-label="Navigasi halaman">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Halaman sebelumnya"
          className={`${btnBase} border border-[rgba(30,39,50,0.12)] text-ink hover:bg-marine/10 hover:text-marine-deep disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Sebelumnya</span>
        </button>

        {pageNumbers.map((n, idx) =>
          n === '...' ? (
            <span key={`gap-${idx}`} className="px-1 text-ink-soft font-bold" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-label={`Halaman ${n}`}
              aria-current={n === page ? 'page' : undefined}
              className={`${btnBase} ${
                n === page
                  ? 'bg-marine text-white shadow-tactile'
                  : 'border border-[rgba(30,39,50,0.12)] text-ink hover:bg-marine/10 hover:text-marine-deep'
              }`}
            >
              {n}
            </button>
          )
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman berikutnya"
          className={`${btnBase} border border-[rgba(30,39,50,0.12)] text-ink hover:bg-marine/10 hover:text-marine-deep disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink`}
        >
          <span className="hidden sm:inline mr-1">Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
