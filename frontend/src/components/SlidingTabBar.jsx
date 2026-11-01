import React from 'react';
import useSlidingIndicator from '../hooks/useSlidingIndicator';

// Bilah tab dengan indikator pil yang meluncur mulus ke tab aktif
// (lihat hooks/useSlidingIndicator untuk konsep geraknya). Warna pil
// mengikuti warna tugas tiap tab dan ikut bertransisi warnanya.
//
// items: [{ key, label, icon?, color }] — color adalah warna latar
// pil saat tab itu aktif (hex). Tombol yang sedang aktif berteks
// putih; perpindahan warna teks diberi jeda kecil agar pilnya tiba
// lebih dulu, meniru rasa pegas pada sakelar fisik.
export default function SlidingTabBar({ items, activeKey, onChange, ariaLabel, className = '' }) {
  const { containerRef, registerItem, box } = useSlidingIndicator(activeKey, items.map((i) => i.key).join(','));
  const activeItem = items.find((i) => i.key === activeKey);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {box && activeItem && (
        <span
          aria-hidden="true"
          className="sliding-indicator rounded-xl"
          style={{
            transform: `translateX(${box.x}px)`,
            width: box.w,
            top: 6,
            bottom: 6,
            backgroundColor: activeItem.color,
          }}
        />
      )}
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            ref={registerItem(item.key)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`relative z-10 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors duration-200 active:scale-[0.97] ${
              active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            style={{ transitionDelay: active ? '60ms' : '0ms' }}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
