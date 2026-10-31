import { useState, useEffect, useMemo } from 'react';

// Pagination client-side: 5 baris per halaman secara bawaan.
// resetDeps: daftar nilai yang bila berubah halaman kembali ke 1
// (mis. filter kelas, tanggal, atau kata pencarian berubah).
export default function usePagination(items, perPage = 5, resetDeps = []) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  useEffect(() => {
    setPage(1);
  }, resetDeps);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page, perPage]
  );

  return { page, setPage, totalPages, pageItems, total: items.length, perPage };
}
