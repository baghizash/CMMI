import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// Popout konfirmasi gaya CMMI, pengganti window.confirm bawaan browser.
// Pemakaian: const ok = await confirmDialog({ message: 'Hapus ...?' });
// ConfirmDialogHost dirender sekali di App.

let openDialog = null;
let pendingResolve = null;

export function confirmDialog({ message, confirmText = 'Ya', cancelText = 'Batal', danger = false } = {}) {
  return new Promise((resolve) => {
    if (!openDialog) {
      // Host belum terpasang: jatuh ke confirm bawaan agar tidak macet.
      resolve(window.confirm(message));
      return;
    }
    pendingResolve = resolve;
    openDialog({ message, confirmText, cancelText, danger });
  });
}

export function ConfirmDialogHost() {
  const [dlg, setDlg] = useState(null);

  useEffect(() => {
    openDialog = (d) => setDlg(d);
    return () => {
      openDialog = null;
    };
  }, []);

  useEffect(() => {
    if (!dlg) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') finish(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dlg]);

  const finish = (value) => {
    setDlg(null);
    if (pendingResolve) {
      pendingResolve(value);
      pendingResolve = null;
    }
  };

  if (!dlg) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 backdrop-blur-[3px] p-4 animate-backdrop-in"
      onClick={() => finish(false)}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Konfirmasi"
        className="bg-white rounded-[24px] shadow-tactile w-full max-w-sm p-6 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${
              dlg.danger ? 'bg-alpa/10 text-alpa' : 'bg-marine/10 text-marine'
            }`}
            aria-hidden="true"
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-ink leading-relaxed pt-2">{dlg.message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => finish(false)}
            className="h-11 px-5 rounded-full border border-[rgba(30,39,50,0.12)] text-sm font-bold text-ink hover:bg-marine/5 transition-colors"
          >
            {dlg.cancelText}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => finish(true)}
            className={`h-11 px-5 rounded-full text-white text-sm font-bold shadow-tactile active:shadow-tactile-pressed transition-all ${
              dlg.danger ? 'bg-alpa hover:brightness-110' : 'bg-marine hover:bg-marine-deep'
            }`}
          >
            {dlg.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
