import { useRef, useState, useLayoutEffect, useCallback } from 'react';

// Indikator pil yang MELUNCUR di belakang tombol tab aktif, mengikuti
// pelajaran dari artikel Studio Nine "The Switch": indikator tidak
// boleh berteleportasi (muncul/hilang sekejap di tombol baru), ia
// harus MENEMPUH jaraknya. Karena posisi tujuan diukur ulang setiap
// kali tab aktif berubah dan transisinya berjalan dari posisi yang
// sedang ter-render, animasinya juga bereaksi wajar saat diklik
// tombol lain di tengah jalan (bisa diinterupsi), seperti pegas.
//
// Pemakaian: bungkus daftar tombol dalam elemen relative, daftarkan
// tiap tombol lewat registerItem(key), lalu gambar satu elemen
// .sliding-indicator dengan style dari hook ini.
export default function useSlidingIndicator(activeKey, watch) {
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [box, setBox] = useState(null);

  const registerItem = useCallback(
    (key) => (el) => {
      if (el) itemRefs.current[key] = el;
    },
    []
  );

  const measure = useCallback(() => {
    const el = itemRefs.current[activeKey];
    if (!el) {
      setBox(null);
      return;
    }
    setBox({ x: el.offsetLeft, w: el.offsetWidth });
  }, [activeKey]);

  useLayoutEffect(() => {
    measure();
  }, [measure, watch]);

  useLayoutEffect(() => {
    window.addEventListener('resize', measure);
    if (document.fonts?.ready) document.fonts.ready.then(() => measure());
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return { containerRef, registerItem, box };
}
